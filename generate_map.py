"""
Generate Folium interactive vessel route map for Tuas Mega Port Resilience Monitor.
Run: python3 generate_map.py
Output: public/folium_map.html
Simulated data only — not for operational navigation.

Map is centered on Singapore / Malacca Strait (lat 2.5, lon 102.0) at zoom 7
so the initial view shows the strait, Tuas, southern Malaysia, and Batam/Sumatra.
Sunda and Lombok routes extend south/east — scroll or zoom out to see them fully.
"""
import folium
from folium.plugins import PolyLineTextPath
import os

# ── Destination ────────────────────────────────────────────────────────────────
TUAS = [1.30, 103.65]

# ── Route origin: north entrance of Malacca Strait (near Langkawi) ────────────
# All three routes start from here and diverge toward their respective straits.
ORIGIN = [5.50, 100.00]

# ── Malacca Strait baseline route ─────────────────────────────────────────────
# Follows the Malacca Strait south from Langkawi/Penang → Singapore Tuas.
MALACCA_ROUTE = [
    [5.50, 100.00],   # North Malacca entrance (Langkawi area)
    [4.80, 100.50],   # Off Penang
    [4.00, 101.00],   # Mid-strait (Malaysia / Sumatra)
    [3.50, 101.50],   # SL TRADER position — 38 nm from anchorage
    [2.80, 102.00],   # Southern Malacca approach
    [2.00, 102.80],   # Entering One Fathom Bank area
    [1.50, 103.30],   # Singapore Strait western entrance
    [1.30, 103.65],   # Tuas Mega Port
]

# ── Sunda Strait reroute ───────────────────────────────────────────────────────
# Diverges west of Sumatra, rounds the southern tip, through Sunda Strait,
# crosses the Java Sea, and arrives at Singapore from the southeast.
SUNDA_ROUTE = [
    [5.50, 100.00],   # Same origin — diverges here
    [3.80, 99.20],    # West of Sumatra, heading south
    [1.50, 98.80],    # Off Nias / west Sumatra coast
    [0.00, 99.50],    # Equator crossing, west Sumatra
    [-2.00, 101.00],  # Southwest Sumatra approach
    [-4.00, 103.50],  # Pre-Sunda approach
    [-5.50, 105.80],  # Sunda Strait (between Java and Sumatra)
    [-4.50, 107.00],  # Java Sea entrance
    [-2.00, 107.50],  # Java Sea
    [0.50, 106.00],   # Approaching Singapore from SE
    [1.30, 103.65],   # Tuas Mega Port
]

# ── Lombok Strait deep alternate ───────────────────────────────────────────────
# Continues south past Sunda, follows the Java coast east,
# passes through Lombok Strait (between Bali and Lombok), then
# crosses the Java Sea westward to Singapore.
LOMBOK_ROUTE = [
    [5.50, 100.00],   # Same origin
    [3.00, 99.00],    # West Sumatra (splits further south than Sunda)
    [0.00, 99.00],    # Equator, west Sumatra
    [-3.00, 101.50],  # Southern Sumatra coast
    [-6.00, 106.00],  # West Java coast
    [-7.50, 111.00],  # Central Java coast
    [-8.70, 115.70],  # Lombok Strait (between Bali and Lombok)
    [-8.00, 114.50],  # Out of Lombok, heading north-west
    [-5.50, 112.00],  # Java Sea (south)
    [-2.50, 109.00],  # Java Sea (central-west)
    [1.00, 104.80],   # Approaching Singapore from east
    [1.30, 103.65],   # Tuas Mega Port
]

# ── Key vessel / incident positions ───────────────────────────────────────────
SL_TRADER_POS      = [3.50, 101.50]   # On Malacca route, 38 nm from anchorage
AURORA_PIONEER_POS = [2.80, 100.80]   # Further back on Malacca route
GOLDEN_STAR_POS    = [1.05, 104.05]   # Near Batam Island (incident)

# ── Colours ────────────────────────────────────────────────────────────────────
C_MALACCA = '#ef4444'   # Red — high/severe risk
C_SUNDA   = '#f59e0b'   # Amber — contingency
C_LOMBOK  = '#5fb0d8'   # Light blue — deep alternate


def _add_route(m, coords, color, weight, dash_array, tooltip_html):
    """Draw a PolyLine with tooltip and PolyLineTextPath direction arrows."""
    line = folium.PolyLine(
        coords,
        color=color,
        weight=weight,
        opacity=0.90,
        tooltip=folium.Tooltip(tooltip_html, sticky=True, max_width=360),
        dash_array=dash_array
    )
    line.add_to(m)
    try:
        PolyLineTextPath(
            line,
            text='  \u25ba  ',   # ► arrow character
            repeat=True,
            offset=18,
            attributes={
                'fill': color,
                'font-size': '14',
                'opacity': '0.85'
            }
        ).add_to(m)
    except Exception:
        pass   # degrade gracefully if plugin unavailable


def _add_gps_pings(m, coords, color, route_name, indices):
    """Add CircleMarker GPS pings at selected waypoints."""
    sim_times = ['06:12', '09:45', '13:20', '17:08', '21:33', '03:15']
    for rank, idx in enumerate(indices):
        if idx >= len(coords):
            continue
        pt = coords[idx]
        ts = sim_times[rank % len(sim_times)]
        folium.CircleMarker(
            location=pt,
            radius=5,
            color=color,
            fill=True,
            fill_color=color,
            fill_opacity=0.75,
            weight=1.5,
            tooltip=folium.Tooltip(
                f'<div style="font-family:monospace;font-size:11px;line-height:1.5">'
                f'<b style="color:{color}">{route_name} GPS ping</b><br>'
                f'Sim time: {ts} UTC | Status: En route<br>'
                f'Lat: {pt[0]:.3f}° &nbsp; Lon: {pt[1]:.3f}°'
                f'</div>',
                sticky=False
            )
        ).add_to(m)


def generate_map(storm_active=False, congestion_active=False,
                 out_path='public/folium_map.html'):
    # ── Base map ───────────────────────────────────────────────────────────────
    # Centered on the Malacca Strait / Singapore region.
    # zoom_start=7 gives a view spanning roughly Penang → Batam × Sumatra → Singapore.
    m = folium.Map(
        location=[2.50, 102.00],
        zoom_start=7,
        min_zoom=5,
        max_zoom=14,
        tiles='CartoDB dark_matter',
        prefer_canvas=True,
        control_scale=True
    )

    # ── Route 1: Malacca Strait baseline ──────────────────────────────────────
    malacca_risk = 'Severe — Gale warning active' if storm_active else 'High — Gale warning active'
    malacca_cc   = 'NOT recommended — storm risk to reefer integrity' if storm_active \
                   else 'Conditional — monitor reefer systems continuously'
    malacca_conf = 'Low' if storm_active else 'Medium'
    malacca_note = 'AVOID — Active storm. Divert cold-chain pharma to Sunda Strait.' if storm_active \
                   else 'Primary route. Gale warning active. Priority berthing for cold-chain SHP-2041/SHP-2042.'

    malacca_tip = (
        '<div style="font-family:monospace;font-size:12px;line-height:1.7;min-width:240px">'
        f'<b style="color:{C_MALACCA}; font-size:13px">Malacca Strait Baseline</b><br>'
        '<hr style="border-color:#333;margin:4px 0">'
        'Delta transit: <b>0 days</b> (primary route)<br>'
        'Cost index: <b>100</b> &nbsp;|&nbsp; CO2 index: <b>100</b><br>'
        f'Risk: <b style="color:{C_MALACCA}">{malacca_risk}</b><br>'
        f'Cold-chain: {malacca_cc}<br>'
        f'Confidence: {malacca_conf}<br>'
        f'<i style="color:#aaa">{malacca_note}</i>'
        '</div>'
    )
    _add_route(m, MALACCA_ROUTE, C_MALACCA, weight=4,
               dash_array='8 4' if storm_active else None,
               tooltip_html=malacca_tip)
    # GPS pings along Malacca route (visible within initial zoom area)
    _add_gps_pings(m, MALACCA_ROUTE, C_MALACCA, 'Malacca', [1, 2, 3, 4, 5])

    # ── Route 2: Sunda Strait reroute ─────────────────────────────────────────
    sunda_tip = (
        '<div style="font-family:monospace;font-size:12px;line-height:1.7;min-width:240px">'
        f'<b style="color:{C_SUNDA}; font-size:13px">Sunda Strait Reroute — Contingency</b><br>'
        '<hr style="border-color:#333;margin:4px 0">'
        'Delta transit: <b>+2 days</b><br>'
        'Cost index: <b>118</b> (×1.18) &nbsp;|&nbsp; CO2 index: <b>115</b> (×1.15)<br>'
        f'Risk: <b style="color:{C_SUNDA}">Medium — calm seas</b><br>'
        'Cold-chain: <b style="color:#22c55e">YES</b> — reefer monitoring intact, 2-8°C suitable<br>'
        'Confidence: High<br>'
        '<i style="color:#aaa">Preferred reroute when Malacca is disrupted. Calmer seas, suitable for cold-chain pharma.</i>'
        '</div>'
    )
    _add_route(m, SUNDA_ROUTE, C_SUNDA, weight=3,
               dash_array='7 4', tooltip_html=sunda_tip)
    _add_gps_pings(m, SUNDA_ROUTE, C_SUNDA, 'Sunda', [1, 3, 5, 7, 8])

    # ── Route 3: Lombok Strait deep alternate ─────────────────────────────────
    lombok_tip = (
        '<div style="font-family:monospace;font-size:12px;line-height:1.7;min-width:240px">'
        f'<b style="color:{C_LOMBOK}; font-size:13px">Lombok Strait Deep Alternate</b><br>'
        '<hr style="border-color:#333;margin:4px 0">'
        'Delta transit: <b>+3.5 days</b><br>'
        'Cost index: <b>126</b> (×1.26) &nbsp;|&nbsp; CO2 index: <b>124</b> (×1.24)<br>'
        f'Risk: <b style="color:#22c55e">Low — clear seas</b><br>'
        'Cold-chain: <b style="color:#f59e0b">CONDITIONAL</b> — +3.5 days may breach 2-8°C service window.<br>'
        '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>Human validation required</b> for pharma cargo.<br>'
        'Confidence: Medium (human validation required)<br>'
        '<i style="color:#aaa">Longest alternate. Use only if Malacca AND Sunda are unavailable. Highest CO2 of all sea routes.</i>'
        '</div>'
    )
    _add_route(m, LOMBOK_ROUTE, C_LOMBOK, weight=3,
               dash_array='4 5', tooltip_html=lombok_tip)
    _add_gps_pings(m, LOMBOK_ROUTE, C_LOMBOK, 'Lombok', [1, 3, 5, 7, 9])

    # ── Tuas Mega Port — destination marker ───────────────────────────────────
    berth_str = 'HIGH CONGESTION ~92%' if congestion_active else 'Normal 70-80%'
    folium.Marker(
        location=TUAS,
        tooltip=folium.Tooltip(
            '<div style="font-family:monospace;font-size:12px;line-height:1.7">'
            '<b style="color:#f58220">⚓ Tuas Mega Port — Destination</b><br>'
            '1.300°N, 103.650°E &nbsp;|&nbsp; Singapore<br>'
            f'Berth occupancy: <b>{berth_str}</b><br>'
            'Status: Active port operations<br>'
            '<i style="color:#aaa">Priority berthing for cold-chain pharma (SHP-2041, SHP-2042)</i>'
            '</div>',
            sticky=True
        ),
        icon=folium.Icon(color='orange', icon='anchor', prefix='fa')
    ).add_to(m)

    # ── SL TRADER — critical cold-chain vessel on Malacca route ───────────────
    folium.Marker(
        location=SL_TRADER_POS,
        tooltip=folium.Tooltip(
            '<div style="font-family:monospace;font-size:12px;line-height:1.7">'
            f'<b style="color:{C_MALACCA}">🚢 SL TRADER (SHP-2041)</b><br>'
            'IMO: IMO9874321<br>'
            'Cargo: Pharmaceuticals — Insulin &amp; Vaccines<br>'
            'Temperature: <b>2-8°C</b> (CRITICAL cold-chain)<br>'
            'Origin: Rotterdam, Netherlands<br>'
            'Current: Malacca Strait — 38 nm from Tuas anchorage<br>'
            'ETA: <b>6h</b> &nbsp;|&nbsp; Status: <b style="color:#ef4444">Critical</b><br>'
            '<b style="color:#ef4444">Inventory risk: Stockout in 18h — priority berthing required</b>'
            '</div>',
            sticky=True
        ),
        icon=folium.Icon(color='red', icon='ship', prefix='fa')
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
            'Temperature: <b>2-8°C</b> (Critical cold-chain)<br>'
            'Origin: Hamburg, Germany<br>'
            'Current: Malacca Strait — 190 nm west of Singapore<br>'
            'ETA: <b>18h</b> &nbsp;|&nbsp; Status: Watch'
            '</div>',
            sticky=True
        )
    ).add_to(m)

    # ── GOLDEN STAR 1 — incident marker near Batam ────────────────────────────
    folium.Marker(
        location=GOLDEN_STAR_POS,
        tooltip=folium.Tooltip(
            '<div style="font-family:monospace;font-size:12px;line-height:1.7">'
            '<b style="color:#a8bbd3">⚠ GOLDEN STAR 1 — Simulated Incident</b><br>'
            'Location: Near Batam Island (1.050°N, 104.050°E)<br>'
            'Event: Vessel grounded on shoal — 5 Jun 2026<br>'
            'Status: <b>All 22 crew rescued.</b> MPA investigation ongoing.<br>'
            '<span style="color:#f59e0b">Operational note:</span> Monitor for regional disruption.<br>'
            'No confirmed impact on Tuas port operations at this time.'
            '</div>',
            sticky=True
        ),
        icon=folium.Icon(color='gray', icon='exclamation-triangle', prefix='fa')
    ).add_to(m)

    # ── Route origin / divergence point ───────────────────────────────────────
    folium.Marker(
        location=ORIGIN,
        tooltip=folium.Tooltip(
            '<div style="font-family:monospace;font-size:12px;line-height:1.7">'
            '<b>Route Divergence — N. Malacca Strait (Langkawi)</b><br>'
            '5.50°N, 100.00°E<br>'
            f'<span style="color:{C_MALACCA}">━</span> Malacca baseline: 0 days delta<br>'
            f'<span style="color:{C_SUNDA}">╌</span> Sunda reroute: +2 days<br>'
            f'<span style="color:{C_LOMBOK}">┄</span> Lombok alternate: +3.5 days'
            '</div>',
            sticky=True
        ),
        icon=folium.Icon(color='blue', icon='play', prefix='fa')
    ).add_to(m)

    # ── Sunda Strait label marker ──────────────────────────────────────────────
    folium.CircleMarker(
        location=[-5.50, 105.80],
        radius=7,
        color=C_SUNDA,
        fill=True,
        fill_color=C_SUNDA,
        fill_opacity=0.50,
        weight=2,
        tooltip=folium.Tooltip(
            f'<div style="font-family:monospace;font-size:11px">'
            f'<b style="color:{C_SUNDA}">Sunda Strait</b><br>'
            'Between Java and Sumatra<br>'
            'Contingency route transit point (+2d)'
            '</div>',
            sticky=False
        )
    ).add_to(m)

    # ── Lombok Strait label marker ─────────────────────────────────────────────
    folium.CircleMarker(
        location=[-8.70, 115.70],
        radius=7,
        color=C_LOMBOK,
        fill=True,
        fill_color=C_LOMBOK,
        fill_opacity=0.50,
        weight=2,
        tooltip=folium.Tooltip(
            f'<div style="font-family:monospace;font-size:11px">'
            f'<b style="color:{C_LOMBOK}">Lombok Strait</b><br>'
            'Between Bali and Lombok<br>'
            'Deep alternate transit point (+3.5d)'
            '</div>',
            sticky=False
        )
    ).add_to(m)

    # ── Legend and disclaimer overlays ────────────────────────────────────────
    legend_html = f'''
    <div style="
        position:fixed;bottom:40px;left:10px;z-index:9999;
        background:rgba(8,16,32,0.90);
        color:#c8d8e8;
        padding:10px 14px;border-radius:8px;
        font-size:11px;font-family:monospace;
        border:1px solid #2a4060;line-height:2;
        pointer-events:none;max-width:210px">
      <div style="font-weight:bold;color:#eef2f8;font-size:12px;margin-bottom:4px">ROUTE LEGEND</div>
      <div><span style="color:{C_MALACCA};font-size:14px">━━</span>&nbsp; Malacca Baseline (0d)</div>
      <div><span style="color:{C_SUNDA};font-size:14px">╌╌</span>&nbsp; Sunda Reroute (+2d)</div>
      <div><span style="color:{C_LOMBOK};font-size:14px">┄┄</span>&nbsp; Lombok Alternate (+3.5d)</div>
      <div style="margin-top:6px">
        <span style="color:#f58220">⚓</span> Tuas Mega Port<br>
        <span style="color:{C_MALACCA}">🚢</span> SL TRADER (Critical)<br>
        <span style="color:#a8bbd3">⚠</span> GOLDEN STAR 1 (Incident)
      </div>
      <div style="margin-top:6px;color:#666;font-size:10px">Hover routes &amp; markers for details</div>
    </div>
    <div style="
        position:fixed;bottom:10px;left:50%;transform:translateX(-50%);
        background:rgba(8,16,32,0.85);color:#a8bbd3;
        padding:3px 16px;border-radius:6px;
        font-size:10px;font-family:monospace;
        z-index:9999;border:1px solid #2a4060;pointer-events:none;
        white-space:nowrap">
      Interactive simulated vessel route map &mdash; not for operational navigation
    </div>
    '''
    m.get_root().html.add_child(folium.Element(legend_html))

    os.makedirs(os.path.dirname(out_path) if os.path.dirname(out_path) else '.', exist_ok=True)
    m.save(out_path)
    return out_path


if __name__ == '__main__':
    path = generate_map()
    print(f'Folium map saved → {path}')
