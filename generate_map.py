"""
Generate Folium interactive vessel route map for Tuas Mega Port Resilience Monitor.
Run: python3 generate_map.py
Output: public/folium_map.html
Simulated data only — not for operational navigation.

Map is centred at [-1, 106] zoom 5 so the initial view covers:
  latitude  : ~-9 to +7 N  (shows all three straits)
  longitude : ~93 to +120 E

Malacca route follows the WATER CHANNEL between Sumatra (west) and
Peninsular Malaysia (east). Sunda and Lombok routes go around the
southern tip of Sumatra to their respective straits.
"""
import folium
from folium.plugins import PolyLineTextPath
import os

# ── Destination ────────────────────────────────────────────────────────────────
TUAS = [1.30, 103.65]

# ── Malacca Strait baseline route ─────────────────────────────────────────────
# These waypoints trace the shipping CHANNEL between Sumatra (west) and
# Peninsular Malaysia (east).  At each latitude the point is in the water
# between Sumatra's east coast and Malaysia's west coast.
#
#  5.8 N   : between N.Sumatra (~97 E) and Langkawi (~100 E)  → ~98.6 E  water ✓
#  5.1 N   : between NW Sumatra coast and Penang approach      → ~99.0 E  water ✓
#  4.3 N   : between Sumatra east (~98 E) and Perak west coast → ~99.4 E  water ✓
#  3.6 N   : between Riau/Sumatra (~100 E) and Klang/Selangor  → ~100.4 E water ✓
#  2.9 N   : around One Fathom Bank, mid-strait                → ~100.9 E water ✓
#  2.2 N   : southern Malacca Strait approach                  → ~101.9 E water ✓
#  1.7 N   : entering Singapore Strait from west               → ~102.9 E water ✓
#  1.3 N   : Tuas                                              → 103.65 E
MALACCA_ROUTE = [
    [5.80, 98.60],   # N. Malacca entrance — between N.Sumatra and Langkawi
    [5.10, 99.00],   # NW Perak approach (in the strait, west of Penang)
    [4.30, 99.40],   # Off mid Perak, in the channel
    [3.60, 100.40],  # Off Klang/Selangor coast — One Fathom Bank area
    [2.90, 100.90],  # Off Port Dickson — mid strait
    [2.20, 101.90],  # Off southern Johor — narrowing strait
    [1.70, 102.90],  # Singapore Strait western entrance
    [1.30, 103.65],  # Tuas Mega Port
]

# SL TRADER: ~38 nm NW of Tuas, on the Malacca route
SL_TRADER_POS = [2.90, 100.90]   # On Malacca route waypoint

# AURORA PIONEER: ~190 nm W of Singapore, on Malacca route (north section)
AURORA_PIONEER_POS = [4.30, 99.40]

# ── Sunda Strait reroute ───────────────────────────────────────────────────────
# Diverges at the N. Malacca entrance, heads SOUTH along Sumatra's WEST coast,
# turns east through the Sunda Strait (-5.5 S, 105.8 E), then crosses the
# Java Sea to Singapore.
SUNDA_ROUTE = [
    [5.80, 98.60],   # Same origin as Malacca — diverges here
    [4.50, 97.50],   # Heads SW, west of Sumatra's north coast
    [2.50, 96.50],   # Off west Sumatra (Nias area)
    [0.50, 97.00],   # Off west Sumatra (equator area)
    [-2.00, 99.00],  # Off SW Sumatra
    [-4.50, 103.00], # Approaching southern tip of Sumatra
    [-5.50, 105.80], # Sunda Strait (between Sumatra tip and Java)
    [-4.80, 107.50], # Into the Java Sea
    [-2.50, 108.50], # Java Sea (heading NW)
    [0.00, 107.00],  # Approaching Borneo/Riau from east
    [1.00, 105.50],  # Approaching Singapore from SE
    [1.30, 103.65],  # Tuas Mega Port
]

# ── Lombok Strait deep alternate ───────────────────────────────────────────────
# Continues past Sunda, skirts Java's south coast, passes through the
# Lombok Strait (-8.5 S, 115.5 E), crosses the Java Sea to Singapore.
LOMBOK_ROUTE = [
    [5.80, 98.60],   # Same origin
    [3.50, 97.00],   # West Sumatra heading further south
    [0.00, 96.50],   # Equator off SW Sumatra
    [-3.00, 100.00], # Off southern Sumatra coast
    [-5.50, 104.50], # Off west Java (passes south of Sunda entry)
    [-7.00, 108.50], # Central Java south coast
    [-7.80, 112.00], # East Java coast
    [-8.50, 115.50], # Lombok Strait (between Bali and Lombok)
    [-7.50, 117.00], # East of Lombok, into Flores Sea
    [-5.00, 115.00], # Heading NW into Java Sea
    [-2.00, 112.00], # Java Sea
    [0.50, 108.00],  # Java Sea (NW)
    [1.00, 105.00],  # Approaching Singapore from E
    [1.30, 103.65],  # Tuas Mega Port
]

# ── Incident / destination coords ─────────────────────────────────────────────
GOLDEN_STAR_POS = [1.05, 104.05]   # Near Batam Island

# ── Colours ────────────────────────────────────────────────────────────────────
C_MALACCA = '#ef4444'
C_SUNDA   = '#f59e0b'
C_LOMBOK  = '#5fb0d8'


def _div_marker(location, color, label, tooltip_html):
    """Add a clearly visible DivIcon marker (avoids FontAwesome dependency)."""
    icon_html = (
        f'<div style="'
        f'width:14px;height:14px;border-radius:50%;'
        f'background:{color};border:2px solid #fff;'
        f'box-shadow:0 0 6px {color};'
        f'"></div>'
    )
    return folium.Marker(
        location=location,
        icon=folium.DivIcon(
            html=icon_html,
            icon_size=(14, 14),
            icon_anchor=(7, 7),
            class_name=''
        ),
        tooltip=folium.Tooltip(tooltip_html, sticky=True, max_width=360)
    )


def _star_marker(location, color, tooltip_html):
    """Diamond/star DivIcon for key points."""
    icon_html = (
        f'<div style="'
        f'width:16px;height:16px;'
        f'background:{color};border:2px solid #fff;'
        f'transform:rotate(45deg);'
        f'box-shadow:0 0 8px {color};'
        f'"></div>'
    )
    return folium.Marker(
        location=location,
        icon=folium.DivIcon(
            html=icon_html,
            icon_size=(16, 16),
            icon_anchor=(8, 8),
            class_name=''
        ),
        tooltip=folium.Tooltip(tooltip_html, sticky=True, max_width=360)
    )


def _add_route(m, coords, color, weight, dash_array, tooltip_html, label):
    """Draw PolyLine with tooltip and direction text arrows."""
    line = folium.PolyLine(
        coords,
        color=color,
        weight=weight,
        opacity=0.90,
        tooltip=folium.Tooltip(tooltip_html, sticky=True, max_width=380),
        dash_array=dash_array
    )
    line.add_to(m)
    try:
        PolyLineTextPath(
            line,
            text=' \u25ba ',
            repeat=True,
            offset=20,
            attributes={'fill': color, 'font-size': '14', 'opacity': '0.9'}
        ).add_to(m)
    except Exception:
        pass
    return line


def _add_gps_pings(m, coords, color, route_name, indices):
    """Add CircleMarker GPS pings at specified waypoint indices."""
    sim_times = ['06:14', '10:02', '14:37', '19:55', '01:08', '05:43']
    for rank, idx in enumerate(indices):
        if idx >= len(coords):
            continue
        pt = coords[idx]
        ts = sim_times[rank % len(sim_times)]
        folium.CircleMarker(
            location=pt,
            radius=6,
            color=color,
            fill=True,
            fill_color=color,
            fill_opacity=0.80,
            weight=2,
            tooltip=folium.Tooltip(
                f'<div style="font-family:monospace;font-size:11px;line-height:1.5">'
                f'<b style="color:{color}">{route_name} GPS ping</b><br>'
                f'Sim time: {ts} UTC | Status: En route<br>'
                f'Lat: {pt[0]:.3f}&deg; &nbsp; Lon: {pt[1]:.3f}&deg;'
                f'</div>',
                sticky=False
            )
        ).add_to(m)


def generate_map(storm_active=False, congestion_active=False,
                 out_path='public/folium_map.html'):

    # ── Base map ───────────────────────────────────────────────────────────────
    # Centre at [-1, 106] zoom 5 → shows Malacca Strait through Lombok Strait
    m = folium.Map(
        location=[-1.0, 106.0],
        zoom_start=5,
        min_zoom=4,
        max_zoom=14,
        tiles='CartoDB dark_matter',
        prefer_canvas=True,
        control_scale=True,
    )

    # ── Route 1: Malacca Strait baseline ──────────────────────────────────────
    malacca_risk = 'Severe — Gale warning active' if storm_active \
                   else 'High — Gale warning active'
    malacca_cc   = 'NOT recommended — storm risk to reefer integrity' if storm_active \
                   else 'Conditional — monitor reefer systems continuously'
    malacca_note = ('AVOID — Active storm. Divert cold-chain pharma to Sunda Strait.'
                    if storm_active
                    else 'Primary route. Gale warning active. Priority berthing for SHP-2041/SHP-2042.')

    malacca_tip = (
        '<div style="font-family:monospace;font-size:12px;line-height:1.7;min-width:260px">'
        f'<b style="color:{C_MALACCA};font-size:13px">&#9664; Malacca Strait Baseline</b><br>'
        '<hr style="border-color:#444;margin:4px 0">'
        'Delta transit: <b>0 days</b> (primary route)<br>'
        'Cost index: <b>100</b> &nbsp;|&nbsp; CO2 index: <b>100</b><br>'
        f'Risk: <b style="color:{C_MALACCA}">{malacca_risk}</b><br>'
        f'Cold-chain: {malacca_cc}<br>'
        f'Confidence: {"Low" if storm_active else "Medium"}<br>'
        f'<i style="color:#aaa">{malacca_note}</i>'
        '</div>'
    )
    _add_route(m, MALACCA_ROUTE, C_MALACCA, weight=5,
               dash_array='8 4' if storm_active else None,
               tooltip_html=malacca_tip, label='Malacca')
    _add_gps_pings(m, MALACCA_ROUTE, C_MALACCA, 'Malacca', [0, 2, 3, 4, 5])

    # ── Route 2: Sunda Strait reroute ─────────────────────────────────────────
    sunda_tip = (
        '<div style="font-family:monospace;font-size:12px;line-height:1.7;min-width:260px">'
        f'<b style="color:{C_SUNDA};font-size:13px">&#9664; Sunda Strait Reroute — Contingency</b><br>'
        '<hr style="border-color:#444;margin:4px 0">'
        'Delta transit: <b>+2 days</b><br>'
        'Cost index: <b>118</b> (&times;1.18) &nbsp;|&nbsp; CO2 index: <b>115</b> (&times;1.15)<br>'
        f'Risk: <b style="color:{C_SUNDA}">Medium — calm seas</b><br>'
        'Cold-chain: <b style="color:#22c55e">YES</b> — 2-8&deg;C suitable, reefer monitoring intact<br>'
        'Confidence: High<br>'
        '<i style="color:#aaa">Preferred reroute when Malacca is disrupted. Recommended for SHP-2041/SHP-2042.</i>'
        '</div>'
    )
    _add_route(m, SUNDA_ROUTE, C_SUNDA, weight=4,
               dash_array='7 4', tooltip_html=sunda_tip, label='Sunda')
    _add_gps_pings(m, SUNDA_ROUTE, C_SUNDA, 'Sunda', [1, 3, 5, 7, 9])

    # ── Route 3: Lombok Strait deep alternate ─────────────────────────────────
    lombok_tip = (
        '<div style="font-family:monospace;font-size:12px;line-height:1.7;min-width:260px">'
        f'<b style="color:{C_LOMBOK};font-size:13px">&#9664; Lombok Strait Deep Alternate</b><br>'
        '<hr style="border-color:#444;margin:4px 0">'
        'Delta transit: <b>+3.5 days</b><br>'
        'Cost index: <b>126</b> (&times;1.26) &nbsp;|&nbsp; CO2 index: <b>124</b> (&times;1.24)<br>'
        f'Risk: <b style="color:#22c55e">Low — clear seas</b><br>'
        'Cold-chain: <b style="color:#f59e0b">CONDITIONAL</b> — +3.5 days may breach 2-8&deg;C service window<br>'
        '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>Human validation required</b> for pharma cargo<br>'
        'Confidence: Medium<br>'
        '<i style="color:#aaa">Longest alternate. Use only if Malacca AND Sunda are unavailable. Highest CO2.</i>'
        '</div>'
    )
    _add_route(m, LOMBOK_ROUTE, C_LOMBOK, weight=4,
               dash_array='4 5', tooltip_html=lombok_tip, label='Lombok')
    _add_gps_pings(m, LOMBOK_ROUTE, C_LOMBOK, 'Lombok', [1, 3, 5, 7, 9, 11])

    # ── Tuas Mega Port — destination marker ───────────────────────────────────
    berth_str = 'HIGH CONGESTION ~92%' if congestion_active else 'Normal 70-80%'
    _star_marker(
        TUAS,
        '#f58220',
        '<div style="font-family:monospace;font-size:12px;line-height:1.7">'
        '<b style="color:#f58220">&#9875; Tuas Mega Port — Destination</b><br>'
        '1.300&deg;N, 103.650&deg;E &nbsp;|&nbsp; Singapore<br>'
        f'Berth occupancy: <b>{berth_str}</b><br>'
        'Status: Active port operations<br>'
        '<i style="color:#aaa">Priority berthing for cold-chain pharma (SHP-2041, SHP-2042)</i>'
        '</div>'
    ).add_to(m)

    # ── SL TRADER — critical cold-chain vessel ────────────────────────────────
    _star_marker(
        SL_TRADER_POS,
        C_MALACCA,
        '<div style="font-family:monospace;font-size:12px;line-height:1.7">'
        f'<b style="color:{C_MALACCA}">&#9664; SL TRADER (SHP-2041)</b><br>'
        'IMO: IMO9874321<br>'
        'Cargo: Pharmaceuticals — Insulin &amp; Vaccines<br>'
        'Temperature: <b>2-8&deg;C</b> (CRITICAL cold-chain)<br>'
        'Origin: Rotterdam, Netherlands<br>'
        'Current: Malacca Strait — 38 nm from Tuas anchorage<br>'
        'ETA: <b>6h</b> &nbsp;|&nbsp; Status: <b style="color:#ef4444">Critical</b><br>'
        '<b style="color:#ef4444">Inventory risk: Stockout in 18h — priority berthing required</b>'
        '</div>'
    ).add_to(m)

    # ── AURORA PIONEER — second cold-chain vessel ──────────────────────────────
    folium.CircleMarker(
        location=AURORA_PIONEER_POS,
        radius=8,
        color=C_SUNDA,
        fill=True,
        fill_color=C_SUNDA,
        fill_opacity=0.85,
        weight=2,
        tooltip=folium.Tooltip(
            '<div style="font-family:monospace;font-size:12px;line-height:1.7">'
            f'<b style="color:{C_SUNDA}">AURORA PIONEER (SHP-2042)</b><br>'
            'Cargo: Biologics — COVID-19 Antivirals &amp; Blood Products<br>'
            'Temperature: <b>2-8&deg;C</b> (Critical cold-chain)<br>'
            'Origin: Hamburg, Germany<br>'
            'Current: Malacca Strait — 190 nm west of Singapore<br>'
            'ETA: <b>18h</b> &nbsp;|&nbsp; Status: Watch'
            '</div>',
            sticky=True
        )
    ).add_to(m)

    # ── GOLDEN STAR 1 — incident marker near Batam ────────────────────────────
    folium.CircleMarker(
        location=GOLDEN_STAR_POS,
        radius=8,
        color='#888',
        fill=True,
        fill_color='#555',
        fill_opacity=0.80,
        weight=2,
        tooltip=folium.Tooltip(
            '<div style="font-family:monospace;font-size:12px;line-height:1.7">'
            '<b style="color:#a8bbd3">&#9888; GOLDEN STAR 1 — Simulated Incident</b><br>'
            'Location: Near Batam Island (1.050&deg;N, 104.050&deg;E)<br>'
            'Event: Vessel grounded on shoal — 5 Jun 2026<br>'
            'Status: <b>All 22 crew rescued.</b> MPA investigation ongoing.<br>'
            '<span style="color:#f59e0b">Operational note:</span> Monitor for regional disruption.<br>'
            'No confirmed impact on Tuas port operations at this time.'
            '</div>',
            sticky=True
        )
    ).add_to(m)

    # ── Route origin / divergence point ───────────────────────────────────────
    _div_marker(
        [5.80, 98.60],
        '#5fb0d8',
        'divergence',
        '<div style="font-family:monospace;font-size:12px;line-height:1.7">'
        '<b>Route Divergence — N. Malacca Strait</b><br>'
        '5.80&deg;N, 98.60&deg;E — between N.Sumatra and Langkawi<br>'
        f'<span style="color:{C_MALACCA}">&#9474;</span> Malacca baseline: 0 days<br>'
        f'<span style="color:{C_SUNDA}">&#8213;</span> Sunda reroute: +2 days<br>'
        f'<span style="color:{C_LOMBOK}">&#8229;</span> Lombok alternate: +3.5 days'
        '</div>'
    ).add_to(m)

    # ── Sunda Strait label ─────────────────────────────────────────────────────
    folium.CircleMarker(
        location=[-5.50, 105.80],
        radius=8,
        color=C_SUNDA,
        fill=True,
        fill_color=C_SUNDA,
        fill_opacity=0.50,
        weight=2,
        tooltip=folium.Tooltip(
            f'<div style="font-family:monospace;font-size:11px">'
            f'<b style="color:{C_SUNDA}">Sunda Strait</b><br>'
            'Between Sumatra (west) and Java (east)<br>'
            'Contingency reroute transit point (+2d)'
            '</div>',
            sticky=False
        )
    ).add_to(m)

    # ── Lombok Strait label ────────────────────────────────────────────────────
    folium.CircleMarker(
        location=[-8.50, 115.50],
        radius=8,
        color=C_LOMBOK,
        fill=True,
        fill_color=C_LOMBOK,
        fill_opacity=0.50,
        weight=2,
        tooltip=folium.Tooltip(
            f'<div style="font-family:monospace;font-size:11px">'
            f'<b style="color:{C_LOMBOK}">Lombok Strait</b><br>'
            'Between Bali (west) and Lombok (east)<br>'
            'Deep alternate transit point (+3.5d)'
            '</div>',
            sticky=False
        )
    ).add_to(m)

    # ── Fixed HTML overlays: legend + disclaimer ───────────────────────────────
    overlay_html = f'''
    <div style="
        position:fixed;bottom:40px;left:10px;z-index:9999;
        background:rgba(8,16,32,0.92);
        color:#c8d8e8;
        padding:10px 14px;border-radius:8px;
        font-size:11px;font-family:monospace;
        border:1px solid #2a4060;line-height:2;
        pointer-events:none;max-width:220px">
      <div style="font-weight:bold;color:#eef2f8;font-size:12px;margin-bottom:4px">ROUTE LEGEND</div>
      <div><span style="color:{C_MALACCA};font-size:15px">&#9475;</span>&nbsp; Malacca Baseline (0d)</div>
      <div><span style="color:{C_SUNDA};font-size:15px">&#9480;</span>&nbsp; Sunda Reroute (+2d)</div>
      <div><span style="color:{C_LOMBOK};font-size:15px">&#9480;</span>&nbsp; Lombok Alternate (+3.5d)</div>
      <div style="margin-top:6px">
        <span style="color:#f58220">&#9670;</span> Tuas Mega Port<br>
        <span style="color:{C_MALACCA}">&#9670;</span> SL TRADER (Critical)<br>
        <span style="color:#888">&#9679;</span> GOLDEN STAR 1 (Incident)
      </div>
      <div style="margin-top:6px;color:#666;font-size:10px">Hover routes &amp; markers for details<br>Zoom in to see Malacca strait detail</div>
    </div>
    <div style="
        position:fixed;bottom:10px;left:50%;transform:translateX(-50%);
        background:rgba(8,16,32,0.88);color:#a8bbd3;
        padding:3px 16px;border-radius:6px;
        font-size:10px;font-family:monospace;
        z-index:9999;border:1px solid #2a4060;pointer-events:none;
        white-space:nowrap">
      Interactive simulated vessel route map &mdash; not for operational navigation
    </div>
    '''
    m.get_root().html.add_child(folium.Element(overlay_html))

    os.makedirs(os.path.dirname(out_path) if os.path.dirname(out_path) else '.', exist_ok=True)
    m.save(out_path)
    return out_path


if __name__ == '__main__':
    path = generate_map()
    print(f'Folium map saved \u2192 {path}')
