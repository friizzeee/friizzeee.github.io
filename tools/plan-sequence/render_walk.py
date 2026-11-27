"""Plan-séquence de l'accueil : la balade dans le studio, de l'entrée du couloir jusqu'au bureau de montage.

Le couloir (26/11/2026) : à gauche, une alcôve par réalisation (un écran 16:9 pour les best-of, des écrans
verticaux pour les shorts), à droite un mur de tasseaux en noyer, au bout le bureau des coulisses
(nether/coulisses/edit/scripts/desk_scene.py, importé sans le modifier). Chaque arrêt cadre l'écran à gauche
de l'image (en haut sur téléphone) : la fiche du site se pose à droite (en bas), sur un mur calme.

Les écrans affichent l'image de départ de leur boucle. Pour chaque image rendue, corners.json donne les quatre
coins de chaque écran quand il est entièrement visible (sinon null) : le site y cale la vraie vidéo (matrix3d).

Lancer (Blender 4.5) :
  blender -b -P render_walk.py -- --out DOSSIER --format 16x9 [--samples 32] [--scale 100]
  --format 9x16 : le trajet du téléphone.
  --test hero,vr,…  : rend seulement ces poses (noms dans POSES), pour cadrer ;  --at 0.5 : un instant du trajet.
  --track-only : recalcule seulement corners.json, sans rien rendre.
"""
import bpy, json, math, os, sys
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(name, default=None):
    return argv[argv.index(name) + 1] if name in argv else default

sys.path.insert(0, arg('--desk', r'C:\Users\Nadeg\Desktop\nether\coulisses\edit\scripts'))
import desk_scene as ds  # noqa: E402

FORMAT = arg('--format', '16x9')
OUT = arg('--out')
SAMPLES = int(arg('--samples', 32))
SCALE = int(arg('--scale', 100))
TEST = arg('--test')
AT = [float(x) for x in arg('--at').split(',')] if arg('--at') else None
POSTERS = arg('--posters', r'C:\Users\Nadeg\Desktop\nether\site\src\assets\take')

# ── Couleurs (linéaires) ─────────────────────────────────────────────────────────
AMBER = (1.0, 0.22, 0.035)       # LED tungstène, comme dans l'ancien travelling
WARM = (1.0, 0.58, 0.30)         # downlights tungstène
CREAM = (1.0, 0.80, 0.55)

# ── Le couloir (mètres, Z en haut ; le bureau est au fond, vers +Y) ───────────────
X_L, X_R = -2.0, 2.0            # murs du couloir
X_BACK = -2.6                   # fond des alcôves (peu profondes : on voit les écrans depuis l'entrée)
Z_CEIL = 2.9
Z_SOFFIT = 2.55
Y_START, Y_END = -27.0, 0.62
SCREEN_Z = 1.42

TV_W, TV_H = 1.22, 0.686          # 55 pouces
PH_W, PH_H = 0.45, 0.80           # écran vertical 36 pouces
PH_GAP = 0.12
MARGIN = 0.5                      # mur libre à gauche des écrans
LABEL = 1.7                       # mur libre à droite : la place de la fiche, comme le cartel d'une œuvre
FIN = 0.6                         # mur plein entre deux alcôves

# Une alcôve par arrêt, de l'entrée vers le bureau : ses écrans (id, largeur, hauteur, image de départ de la boucle)
GROUPS = [
    ('vr', [('vr', TV_W, TV_H, 'plan-victoire-royale.jpg')]),
    ('marty', [('marty', TV_W, TV_H, 'plan-marty.jpg')]),
    ('marty-shorts', [('marty-shorts-0', PH_W, PH_H, 'plan-short-nvidia.jpg'),
                      ('marty-shorts-1', PH_W, PH_H, 'plan-short-55k.jpg')]),
    ('gb', [('gb', TV_W, TV_H, 'plan-golden-boy.jpg')]),
    ('gb-shorts', [('gb-shorts-0', PH_W, PH_H, 'plan-gb-short-reconnait.jpg'),
                   ('gb-shorts-1', PH_W, PH_H, 'plan-gb-short-chat.jpg'),
                   ('gb-shorts-2', PH_W, PH_H, 'plan-gb-short-voiture.jpg')]),
]
ALCOVES = []   # (id, y0, y1)
SCREENS = []   # (id, alcôve, centre Y, largeur, hauteur, image)
_y = -22.6
for _alc, _scr in GROUPS:
    _total = sum(s[1] for s in _scr) + PH_GAP * (len(_scr) - 1)
    _cur = _y + MARGIN
    for _sid, _w, _h, _img in _scr:
        SCREENS.append((_sid, _alc, _cur + _w / 2, _w, _h, _img))
        _cur += _w + PH_GAP
    ALCOVES.append((_alc, _y, _y + MARGIN + _total + LABEL))
    _y = ALCOVES[-1][2] + FIN
ALC = {a: (y0, y1) for a, y0, y1 in ALCOVES}
SCREEN_X = X_BACK + 0.047        # dalle, juste devant le fond de l'écran


def screen_corners(yc, w, h):
    """Coins vus de face (on regarde vers -X, la droite est +Y) : haut-gauche, haut-droite, bas-droite, bas-gauche."""
    x = SCREEN_X
    return [Vector((x, yc - w / 2, SCREEN_Z + h / 2)), Vector((x, yc + w / 2, SCREEN_Z + h / 2)),
            Vector((x, yc + w / 2, SCREEN_Z - h / 2)), Vector((x, yc - w / 2, SCREEN_Z - h / 2))]


# ── Construction ─────────────────────────────────────────────────────────────────
def bounds_box(name, x0, x1, y0, y1, z0, z1, material, bevel=0.0):
    return ds.box(name, (x1 - x0, y1 - y0, z1 - z0), ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), material, bevel=bevel)


def screen_material(name, image_path, strength):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    N = m.node_tree.nodes
    L = m.node_tree.links
    for n in list(N):
        N.remove(n)
    out = N.new('ShaderNodeOutputMaterial')
    add = N.new('ShaderNodeAddShader')
    em = N.new('ShaderNodeEmission')
    em.inputs['Strength'].default_value = strength
    gl = N.new('ShaderNodeBsdfGlossy')
    gl.inputs['Roughness'].default_value = 0.09
    gl.inputs['Color'].default_value = (0.03, 0.03, 0.035, 1)
    ti = N.new('ShaderNodeTexImage')
    ti.image = bpy.data.images.load(image_path)
    ti.interpolation = 'Cubic'
    ti.extension = 'EXTEND'
    L.new(ti.outputs['Color'], em.inputs['Color'])
    L.new(em.outputs[0], add.inputs[0])
    L.new(gl.outputs[0], add.inputs[1])
    L.new(add.outputs[0], out.inputs[0])
    return m


def quad(name, corners, material):
    """Plan à 4 sommets (haut-gauche, haut-droite, bas-droite, bas-gauche) avec ses UV, l'image à l'endroit."""
    tl, tr, br, bl = corners
    me = bpy.data.meshes.new(name)
    me.from_pydata([bl, br, tr, tl], [], [(0, 1, 2, 3)])
    uv = me.uv_layers.new(name='UVMap')
    for i, co in enumerate([(0, 0), (1, 0), (1, 1), (0, 1)]):
        uv.data[i].uv = co
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(material)
    return ob


def light(kind, name, loc, energy, colour, aim=None, size=(0.5, 0.5), spot=None, spread=None, shadow=True):
    d = bpy.data.lights.new(name, kind)
    d.use_shadow = shadow
    d.energy = energy
    d.color = colour
    if kind == 'AREA':
        d.shape = 'RECTANGLE'
        d.size, d.size_y = size
        if spread is not None:
            d.spread = spread
    if kind == 'SPOT' and spot:
        d.spot_size, d.spot_blend = spot
    if kind in ('SPOT', 'POINT'):
        d.shadow_soft_size = size[0]
    o = bpy.data.objects.new(name, d)
    o.location = loc
    bpy.context.collection.objects.link(o)
    if aim:
        ds.look_at(o, Vector(aim))
    return o


def place(name, loc, rot_z=0.0, scale=1.0):
    """Importe un modèle Poly Haven (CC0) et pose sa racine."""
    objs = ds.import_gltf(name, loc, rot_z=rot_z, scale=scale)
    for o in objs:
        if o.parent is None:
            o.location = loc
            o.scale = (scale, scale, scale)
    return objs


def plaster_mat():
    m = ds.mat('corridor_plaster', (0.15, 0.148, 0.142), 0.92, spec=0.3)
    nt = m.node_tree
    d = os.path.join(ds.ASSETS, 'textures', 'grey_plaster_02')
    f = next(x for x in os.listdir(d) if '_nor_gl_' in x)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    ti = nt.nodes.new('ShaderNodeTexImage')
    ti.image = bpy.data.images.load(os.path.join(d, f))
    ti.image.colorspace_settings.name = 'Non-Color'
    nm = nt.nodes.new('ShaderNodeNormalMap')
    nm.inputs['Strength'].default_value = 0.35
    nt.links.new(tc.outputs['UV'], ti.inputs['Vector'])
    nt.links.new(ti.outputs['Color'], nm.inputs['Color'])
    nt.links.new(nm.outputs['Normal'], nt.nodes['Principled BSDF'].inputs['Normal'])
    return m


def build():
    parts = ds.build()
    # Le sol 6 × 6 du bureau laisse place au parquet du couloir ; la lumière froide d'appoint devient chaude.
    bpy.data.objects.remove(bpy.data.objects['floor'], do_unlink=True)
    fill = bpy.data.objects['fill']
    fill.data.color = CREAM
    fill.data.energy = 3.0

    # Bureau en tungstène
    parts['halo'].data.color = (1.0, 0.42, 0.10)
    parts['halo'].data.energy *= 0.6
    parts['wash'].data.color = AMBER
    parts['strip_em'].inputs['Color'].default_value = (1.0, 0.36, 0.07, 1)
    parts['kb_glow_em'].inputs['Color'].default_value = (*(1.0, 0.30, 0.08), 1)
    parts['kb_glow_em'].inputs['Strength'].default_value = 0.5
    ds.set_screen(parts, os.path.join(POSTERS, 'plan-coulisses.jpg'))

    plaster = plaster_mat()
    floor_m = ds.tex_mat('corridor_floor', 'dark_wooden_planks', scale=1.0, tint=0.55, rough_mul=0.55, normal=0.35)
    ceil_m = ds.mat('ceiling', (0.012, 0.012, 0.013), 0.85)
    felt = ds.mat('felt', (0.008, 0.008, 0.009), 0.95)
    walnut = bpy.data.materials['walnut']
    black = bpy.data.materials['plastic_black']

    floor = bounds_box('corridor_floor', X_BACK - 0.1, X_R + 0.1, Y_START, Y_END + 0.1, -0.02, 0.0, floor_m)
    ds.uv_project(floor, 2.4)
    bounds_box('corridor_ceiling', X_BACK - 0.1, X_R + 0.1, Y_START, Y_END + 0.1, Z_CEIL, Z_CEIL + 0.05, ceil_m)
    bounds_box('start_wall', X_BACK, X_R, Y_START - 0.05, Y_START, 0, Z_CEIL, plaster)

    # Mur de droite : feutre noir et tasseaux de noyer (un seul tasseau, répété)
    bounds_box('right_felt', X_R, X_R + 0.03, Y_START, Y_END, 0, Z_CEIL, felt)
    slat = bounds_box('slat', X_R - 0.028, X_R, Y_START + 0.2, Y_START + 0.235, 0.08, 2.78, walnut)
    ds.uv_project(slat, 1.0)
    arr = slat.modifiers.new('rows', 'ARRAY')
    arr.use_relative_offset = False
    arr.use_constant_offset = True
    arr.constant_offset_displace = (0, 0.088, 0)
    arr.count = int((Y_END - Y_START - 0.6) / 0.088)
    bounds_box('slat_base', X_R - 0.05, X_R, Y_START, Y_END, 0, 0.08, black)
    ds.emitter('slat_led', (0.012, Y_END - Y_START - 0.4, 0.006), (X_R - 0.06, (Y_START + Y_END) / 2, 0.085), AMBER, 4.0)

    # Mur de gauche : segments pleins entre les alcôves (les « ailettes »), fond, plafond bas et linteau des alcôves
    edges = [Y_START] + [v for _, y0, y1 in ALCOVES for v in (y0, y1)] + [Y_END]
    for i in range(0, len(edges), 2):
        w = bounds_box(f'left_wall_{i}', X_BACK - 0.1, X_L, edges[i], edges[i + 1], 0, Z_CEIL, plaster)
        ds.uv_project(w, 2.2)
    for name, y0, y1 in ALCOVES:
        back = bounds_box(f'{name}_back', X_BACK - 0.05, X_BACK, y0, y1, 0, Z_CEIL, plaster)
        ds.uv_project(back, 2.2)
        lintel = bounds_box(f'{name}_lintel', X_BACK, X_L, y0, y1, Z_SOFFIT, Z_CEIL, plaster)
        ds.uv_project(lintel, 2.2)
        yc = (y0 + y1) / 2
        rows = [(c, w) for _, a, c, w, *_ in SCREENS if a == name]
        g0 = min(c - w / 2 for c, w in rows)
        g1 = max(c + w / 2 for c, w in rows)
        # Lumière rasante sur tout le fond (cachée par le plafond bas) : l'écran et le mur de la fiche
        light('AREA', f'{name}_cove', (X_BACK + 0.22, yc, Z_SOFFIT - 0.04), 70, CREAM,
              aim=(X_BACK, yc, 0.9), size=(y1 - y0 - 0.3, 0.08), spread=math.radians(70))
        # Un spot devant les écrans, qui dessine une flaque sur le parquet
        light('SPOT', f'{name}_spot', (X_L - 0.3, (g0 + g1) / 2, Z_SOFFIT - 0.02), 160, WARM,
              aim=(X_L + 0.1, (g0 + g1) / 2, 0.0), size=(0.05, 0.05), spot=(math.radians(55), 0.6))
        # Meuble bas sous les écrans seulement
        bounds_box(f'{name}_console', X_BACK, X_BACK + 0.36, g0 - 0.15, g1 + 0.15, 0.12, 0.45, walnut, bevel=0.006)
        bounds_box(f'{name}_console_foot', X_BACK + 0.02, X_BACK + 0.32, g0 - 0.1, g1 + 0.1, 0.0, 0.12, black)

    # Écrans et leur lumière
    mats = {}
    for sid, alcove, yc, w, h, img in SCREENS:
        corners = screen_corners(yc, w, h)
        mats[sid] = screen_material(f'{sid}_mat', os.path.join(POSTERS, img), 1.15)
        quad(f'scr_{sid}', corners, mats[sid])
        bounds_box(f'{sid}_body', X_BACK, SCREEN_X - 0.001, yc - w / 2 - 0.008, yc + w / 2 + 0.008,
                   SCREEN_Z - h / 2 - 0.008, SCREEN_Z + h / 2 + 0.008, black, bevel=0.003)
        light('AREA', f'{sid}_light', (SCREEN_X + 0.02, yc, SCREEN_Z), 28 if w > 1 else 10, (0.75, 0.82, 1.0),
              aim=(X_L + 1, yc, SCREEN_Z), size=(w, h), spread=math.radians(110), shadow=False)

    # Lumière du couloir : des flaques chaudes au sol, et le mur de tasseaux éclairé en rasant, par tronçons
    y = Y_START + 2.0
    while y < -1.5:
        light('SPOT', f'pool_{y:.1f}', (0.35, y, Z_CEIL - 0.02), 200, WARM, aim=(0.35, y, 0), size=(0.04, 0.04),
              spot=(math.radians(58), 0.8))
        ds.emitter(f'pool_fixture_{y:.1f}', (0.12, 0.12, 0.006), (0.35, y, Z_CEIL - 0.003), CREAM, 6.0)
        y += 4.6
    y = Y_START + 1.5
    while y < Y_END - 1.0:
        light('AREA', f'slat_wash_{y:.1f}', (X_R - 0.32, y, Z_CEIL - 0.06), 95, (1.0, 0.68, 0.42),
              aim=(X_R, y, 0.7), size=(0.06, 3.2), spread=math.radians(50), shadow=False)
        y += 3.6

    # Quelques objets (Poly Haven, CC0)
    vr0, vr1 = ALC['vr']
    place('gaming_console', (X_BACK + 0.2, vr0 + MARGIN + 0.25, 0.45), rot_z=math.radians(90))
    place('potted_plant_02', (X_BACK + 0.28, vr1 - 0.35, 0.0))
    place('potted_plant_04', (X_BACK + 0.28, ALC['gb'][1] - 0.3, 0.0))
    place('mid_century_lounge_chair', (X_R - 0.75, ALC['marty-shorts'][1] - 0.2, 0.0), rot_z=math.radians(90))
    place('side_table_01', (X_R - 0.55, ALC['marty-shorts'][1] + 0.6, 0.0))
    place('potted_plant_02', (X_R - 0.45, -4.2, 0.0), scale=1.1)
    return parts


# ── Caméra ──────────────────────────────────────────────────────────────────────
def group_center(prefix):
    pts = [Vector((SCREEN_X, yc, SCREEN_Z)) for _, alcove, yc, *_ in SCREENS if alcove == prefix]
    return sum(pts, Vector()) / len(pts)


def group_width(prefix):
    rows = [(yc, w) for _, alcove, yc, w, *_ in SCREENS if alcove == prefix]
    return max(yc + w / 2 for yc, w in rows) - min(yc - w / 2 for yc, w in rows)


def stop_pose(group):
    """Pose d'arrêt : l'écran à gauche (paysage) ou en haut (portrait), la fiche à côté, sur un mur calme."""
    if group == 'desk':
        if FORMAT == '16x9':
            return dict(pos=(0.62, -1.28, 1.22), aim=(0.34, 0.2, 1.06), lens=38)
        return dict(pos=(0.0, -1.05, 1.02), aim=(0.0, 0.2, 0.86), lens=24)
    c = group_center(group)
    width = group_width(group)
    if FORMAT == '16x9':
        # Le groupe à gauche (bord gauche vers 7,5 %), le mur libre à droite pour la fiche.
        fill = 0.54 if width > 1.4 else 0.46 if width < 1.1 else 0.48
        x = 0.3
        dist = x - SCREEN_X
        half = width / fill / 2
        lens = 18 * dist / half
        u = 0.075 + width / (4 * half)
        aim_y = c.y + (0.5 - u) * 2 * half
        return dict(pos=(x, aim_y + 0.35, 1.42), aim=(X_BACK, aim_y, 1.38), lens=lens)
    lens = 26
    # 72 % de la largeur : les téléphones (plus étroits que 9:16) recadrent les bords sans couper l'écran.
    d = width / (0.72 * 2 * (10.125 / lens))
    return dict(pos=(SCREEN_X + d, c.y, 1.16), aim=(X_BACK, c.y, 1.0), lens=lens)


HERO = {
    '16x9': dict(pos=(1.45, -25.6, 1.45), aim=(-0.7, -14.8, 1.25), lens=24),
    '9x16': dict(pos=(1.1, -25.6, 1.4), aim=(-0.8, -14.8, 1.3), lens=20),
}[FORMAT]

STOPS = ['vr', 'marty', 'marty-shorts', 'gb', 'gb-shorts', 'desk']
POSES = {'hero': HERO, **{s: stop_pose(s) for s in STOPS}}

# Assez d'images pour que la caméra ne saute pas plus d'1° environ d'une image à l'autre (sinon : saccades au défilement).
LEG = 64          # images entre deux arrêts
HERO_LEG = 104    # de l'entrée jusqu'au premier arrêt (5 m de marche et un virage de 80°)
DRIFT = 8         # images d'un arrêt (la caméra s'avance de quelques centimètres)
DRIFT_M = 0.10


def lerp(a, b, t):
    return a + (b - a) * t


def smooth(t):
    return t * t * (3 - 2 * t)


def bezier(p0, p1, p2, p3, t):
    u = 1 - t
    return p0 * u ** 3 + p1 * 3 * u * u * t + p2 * 3 * u * t * t + p3 * t ** 3


def drifted(p):
    pos, aim = Vector(p['pos']), Vector(p['aim'])
    d = (aim - pos).normalized()
    return dict(pos=tuple(pos + d * DRIFT_M), aim=p['aim'], lens=p['lens'])


def leg_frames(a, b, n, first):
    """Un trajet a → b : on part le long du couloir, le regard passe devant soi, puis se tourne vers l'écran."""
    pa, pb = Vector(a['pos']), Vector(b['pos'])
    ta, tb = Vector(a['aim']), Vector(b['aim'])
    # Depuis l'entrée, on regarde le couloir ; entre deux alcôves, le regard glisse en diagonale vers la suivante
    # (un virage d'une centaine de degrés par trajet au lieu de 170 : l'écran suivant ne traverse plus l'image d'un coup).
    ahead = Vector((lerp(pa.x, pb.x, 0.5) - 0.6, pb.y + 4.5, 1.38)) if first else Vector((X_L, pb.y + 1.0, 1.38))
    gap = max(1.0, (pb - pa).length)
    p1 = pa + Vector((0.15, gap * 0.35, 0.0))
    p2 = pb - Vector((-0.15, gap * 0.35, 0.0))
    out = []
    for i in range(0 if first else 1, n + 1):
        s = smooth(i / n)
        pos = bezier(pa, p1, p2, pb, s)
        aim = ((1 - s) ** 2) * ta + 2 * (1 - s) * s * ahead + s * s * tb
        out.append(dict(pos=tuple(pos), aim=tuple(aim), lens=lerp(a['lens'], b['lens'], s)))
    return out


def path():
    """Toutes les poses, et l'image où se pose chaque arrêt."""
    poses = []
    marks = {'hero': 0}
    prev = HERO
    for k, stop in enumerate(STOPS):
        arrive = POSES[stop]
        poses += leg_frames(prev, arrive, HERO_LEG if k == 0 else LEG, first=(k == 0))
        marks[stop] = len(poses) - 1
        settle = drifted(arrive)
        for i in range(1, DRIFT + 1):
            s = i / DRIFT
            poses.append(dict(pos=tuple(lerp(Vector(arrive['pos']), Vector(settle['pos']), s)),
                              aim=arrive['aim'], lens=arrive['lens']))
        prev = settle
    return poses, marks


def set_pose(cam, p):
    cam.location = Vector(p['pos'])
    ds.look_at(cam, Vector(p['aim']))
    cam.data.lens = p['lens']
    cam.data.dof.focus_distance = max(0.5, (Vector(p['aim']) - cam.location).length)


# ── Coins et visibilité de chaque écran ─────────────────────────────────────────
def screen_track(sc, cam, objs):
    bpy.context.view_layer.update()
    deps = bpy.context.evaluated_depsgraph_get()
    origin = cam.matrix_world.translation
    out = {}
    for sid, corners, ob in objs:
        ok = True
        flat = []
        for co in corners:
            v = world_to_camera_view(sc, cam, co)
            if v.z < 0.05:
                ok = False
                break
            flat.append([round(v.x, 5), round(1.0 - v.y, 5)])
        if ok:
            # Face à la caméra, et rien devant : 9 points de la dalle, chacun doit être touché en premier.
            n = (corners[3] - corners[0]).cross(corners[1] - corners[0]).normalized()  # vers le spectateur
            centre = sum(corners, Vector()) / 4
            if n.dot((origin - centre).normalized()) < 0.12:
                ok = False
        if ok:
            for u in (0.03, 0.5, 0.97):
                for w in (0.03, 0.5, 0.97):
                    top = corners[0].lerp(corners[1], u)
                    bottom = corners[3].lerp(corners[2], u)
                    p = top.lerp(bottom, w)
                    d = p - origin
                    hit, loc, _, _, obj, _ = sc.ray_cast(deps, origin, d.normalized(), distance=d.length + 0.01)
                    if hit and obj.name != ob.name and (loc - origin).length < d.length - 0.004:
                        ok = False
                        break
                if not ok:
                    break
        out[sid] = flat if ok else None
    return out


def main():
    build()
    sc = bpy.context.scene
    res = (1920, 1080) if FORMAT == '16x9' else (1080, 1920)
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = SCALE
    sc.eevee.taa_render_samples = SAMPLES
    sc.render.use_motion_blur = False
    if hasattr(sc.eevee, 'shadow_pool_size'):
        sc.eevee.shadow_pool_size = '1024'  # sinon « Shadow buffer full » : des ombres manquent d'une image à l'autre
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = 'AgX - Medium High Contrast'
    sc.view_settings.exposure = 0.15
    sc.world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.006, 0.0055, 0.005, 1)
    sc.render.image_settings.file_format = 'PNG'

    cd = bpy.data.cameras.new('walk')
    cd.sensor_width = 36
    cd.sensor_fit = 'AUTO'
    cd.dof.use_dof = True
    cd.dof.aperture_fstop = 3.2
    cam = bpy.data.objects.new('walk', cd)
    sc.collection.objects.link(cam)
    sc.camera = cam

    objs = [(sid, screen_corners(yc, w, h), bpy.data.objects[f'scr_{sid}']) for sid, _, yc, w, h, _ in SCREENS]
    c, w, h = ds.SCR_C, ds.SCR_W, ds.SCR_H
    y = c.y - 0.0005
    objs.append(('desk', [Vector((c.x - w / 2, y, c.z + h / 2)), Vector((c.x + w / 2, y, c.z + h / 2)),
                          Vector((c.x + w / 2, y, c.z - h / 2)), Vector((c.x - w / 2, y, c.z - h / 2))],
                 bpy.data.objects['screen']))

    os.makedirs(OUT, exist_ok=True)
    poses, marks = path()
    if TEST:
        for name in TEST.split(','):
            set_pose(cam, POSES[name])
            sc.render.filepath = os.path.join(OUT, f'test_{FORMAT}_{name}.png')
            bpy.ops.render.render(write_still=True)
        return
    if AT:
        for t in AT:
            i = round(t * (len(poses) - 1))
            set_pose(cam, poses[i])
            sc.render.filepath = os.path.join(OUT, f'at_{FORMAT}_{i:04d}.png')
            bpy.ops.render.render(write_still=True)
        return

    track = []
    for i, p in enumerate(poses):
        set_pose(cam, p)
        track.append(screen_track(sc, cam, objs))
        if '--track-only' in argv:  # coins seulement (les images déjà rendues ne changent pas)
            continue
        sc.render.filepath = os.path.join(OUT, f'{i:04d}.png')
        bpy.ops.render.render(write_still=True)

    with open(os.path.join(OUT, 'corners.json'), 'w', encoding='utf-8') as f:
        json.dump({'format': FORMAT, 'width': res[0], 'height': res[1], 'frames': len(poses), 'stops': marks,
                   'screens': {sid: [t[sid] for t in track] for sid, _, _ in objs}}, f, separators=(',', ':'))


main()
