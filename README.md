# Mamaro*next* — 2026-2027 School and District Goals

A visual navigator for the Mamaroneck UFSD 2026-2027 district and school goals.

All 28 goals are shown as a **bubble map**, grouped into regions by whichever
organizing principle you pick. Big bubbles are big goals; smaller bubbles are the
school goals that sit under them. Bubbles are draggable, and umbrella goals
expand to reveal their schools.

## Running it

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:8087.

`npm run build` writes to `.next-build` (not `.next`), so a production build can
run while the dev server is up without clobbering its cache. `npm run start`
serves that build, also on port 8087, bound to all interfaces.

## Static export

Nothing in this app runs server-side, so it can be built as a plain folder of
files and hosted anywhere — object storage, GitHub Pages, Cloudflare Pages,
Netlify — with no Node process at all:

```bash
npm run export
```

That writes `out/` (about 1 MB, ~20 files). Serve it with any static host, or
locally with `cd out && python3 -m http.server 8099`. For a sub-path, set
`BASE_PATH` on the export too: `BASE_PATH=/goals npm run export`.

The Node server below is only needed if you'd rather run it that way.

## Running on a headless server

Needs Node 18.18 or newer — Ubuntu's default `nodejs` package is usually too old,
so install a current one first:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs
```

Then clone, build, and serve:

```bash
git clone https://github.com/jpmoo/mamaronext.git && cd mamaronext && npm ci && npm run build && npm run start
```

It listens on port 8087 on every interface, so it's reachable at
`http://<server-ip>:8087`. Open the port if a firewall is running:

```bash
sudo ufw allow 8087/tcp
```

To keep it running across logouts and reboots, install it as a systemd service:

```bash
BASE_PATH=/mamaronext ./deploy/install-service.sh
```

Drop the `BASE_PATH=` prefix if you serve it at the root of a domain. The script
builds, writes `/etc/systemd/system/mamaronext.service` with your user and paths
filled in, and enables it so it comes back on boot. The base path is recorded in
the unit so later rebuilds can't drift out of sync with it.

To deploy a later change — stops the service, pulls, rebuilds, starts it again:

```bash
./restart.sh
```

### Behind a reverse proxy (Caddy, nginx)

The page HTML asks for its stylesheet at `/_next/static/css/...`. If the proxy
doesn't route that path to this app, the page loads but renders unstyled — that
is the usual cause of "CSS isn't showing".

Serving at the root of a domain needs nothing special:

```caddyfile
goals.example.org {
	reverse_proxy 127.0.0.1:8087
}
```

Watch out for a `root`/`file_server` directive in the same site block: it will
answer `/_next/static/*` from disk with a 404 before the proxy ever sees it. A
site block should proxy everything, or route static paths explicitly.

Serving under a **sub-path** additionally needs `BASE_PATH` set **at build time**,
because the asset URLs are baked into the build:

```bash
BASE_PATH=/goals npm run build && BASE_PATH=/goals npm run start
```

```caddyfile
example.org {
	reverse_proxy /goals* 127.0.0.1:8087
}
```

Use `reverse_proxy /goals*`, not `handle_path /goals*` — `handle_path` strips the
prefix, which fights `basePath` rather than complementing it. Add
`Environment=BASE_PATH=/goals` to the systemd unit so restarts keep it.

To check which case you're in, ask the proxy for the stylesheet directly:

```bash
curl -sI https://your-domain/_next/static/css/ -o /dev/null -w '%{http_code}\n'
```

## Source documents

The PDF and scorecard image this was transcribed from live in `resources/`, which
is gitignored — the repo is public and those are internal planning documents. The
transcription itself is in `lib/goals.ts`, so nothing in `resources/` is needed to
run the app.

## Arranging the map

The **Arrange by** picker chooses what the regions mean. The same 28 goals are
re-filed each time:

| Lens | Regions |
|---|---|
| **Personalization / Mentorship / Expertise** (default) | the kind of work a goal represents |
| **Scorecard bucket** | the four desired outcomes on the district scorecard (ESL, ADB, AEG, RII) |
| **Superintendent's Initiatives** | the four initiatives from the goals chart |
| **Data points touched** | every named data source a goal's plan or measure uses |

In the data-points view a goal appears **once per data source it touches**, so a
goal touching two sources draws twice — that view has 38 bubbles for 28 goals. Its regions are neutral and bubbles keep their initiative color,
because more than four categorical colors can't be told apart reliably.

The initiative and scorecard *categories* come from the district's own documents;
the Personalization / Mentorship / Expertise categories, and the decision about
which bucket or data points each individual goal belongs to, are editorial
judgment calls. They all live in
[`lib/classifications.ts`](lib/classifications.ts) — one line per goal, meant to
be argued with and edited.

Every goal draws at the same size — no goal is visually ranked above another.
Two things vary:

- **A dashed outline** marks an *umbrella* goal spanning several schools. There
  is one: Elementary Literacy achievement, carried by all four elementary schools
  with a distinct condition and measure at each building. It starts collapsed;
  click it to pop the four schools out and open its panel, click again to
  collapse. A school goal always sits with its umbrella, whichever lens is
  active, so expanding always shows the whole family in one place.
- **Smaller bubbles, linked by a line**, are the school goals hanging off that
  umbrella. They're labeled by school, since the school is what distinguishes
  them.

Goals scoped to one or two schools name them beneath the title (`HMX` =
Hommocks, `MHS` = Mamaroneck High School).

Click any bubble for the full **Condition / Fall Semester / Spring Semester**
detail, including each semester's "progress to present" measure. The panel is
non-modal — the map stays visible and draggable beside it — and its chips show
the goal's initiative, theme, scorecard bucket, and every data point it touches.
Umbrella and child goals cross-link to each other.

**Drag any bubble** to rearrange it. A dragged bubble stays where you drop it and
its neighbours make room; **Reset layout** releases every pin and re-packs from
scratch. Bubbles stay inside their own region, so dragging never changes what a
goal is filed under.

Filter by school with the chips, or search — the search covers goal titles,
conditions, semester plans, and measures, so a query like `Open Architects` finds
every goal that depends on it.

The **Table** view lists the same data as text, bucketed by the same lens as the
map, with sections that collapse individually. It doubles as the accessibility
fallback so no meaning rests on color alone. Long cells expand on row hover.

### PDF export

**Export PDF** in the table view prints a document the app paginates itself.

That is deliberate. Left to the browser, a long table fragments differently in
every engine — the same document printed clean in Chrome and produced dozens of
blank pages in Firefox, and no combination of `break-inside`, `break-after`, or
repeated-header CSS fixed it in both. So the browser no longer decides: the app
measures every row at the printed width, packs whole rows into fixed page-sized
blocks, and puts an explicit page break after each. Nothing straddles a page
boundary, so there is nothing to fragment.

Pages are sized to the *smaller* of Letter and A4 in landscape (980 x 715 CSS
px at 96dpi, 10mm margins), so one block fits either paper. The export reflects
the current lens, filters, search, and which sections are expanded, and carries
the full prose rather than the clamped on-screen version. See
[`app/components/PrintDocument.tsx`](app/components/PrintDocument.tsx).

## Layout behavior

The bubble packing is computed at the container's real size and rebuilt on
resize, so it fills the window rather than letter-boxing inside a fixed canvas:

- **Wide screens, four regions or fewer** — side-by-side columns, widths
  proportional to the bubble area each region must hold.
- **Wide screens, more than four regions** — an even grid, sized to waste as few
  cells as possible.
- **Narrow screens (< 900px)** — full-width stacked rows, with the page scrolling
  instead of locking to the viewport.

Regions with nothing in them aren't drawn.

Bubble radii share one global scale factor chosen so the tightest region still
fits its largest bubble, so size stays comparable across the whole map.

Positions come from a d3-force simulation, settled synchronously with
deterministic seed positions — the same window size always produces the same
picture. The simulation stays live for dragging, and drag movement is stepped
straight from the pointer stream rather than the simulation's own
requestAnimationFrame timer, which can be starved in a background tab.

## Colors

One four-slot categorical palette serves every lens, and a bubble takes its
region's color — so color always answers "which region is this in", matching the
map, the legend, and the table's row dots. The data-points lens has more than
four regions, so there bubbles fall back to their initiative color and the region
plates go neutral.

The palette was validated with the data-visualization palette checker under the
all-pairs rule (which is what a bubble chart needs, since any two marks can end
up adjacent): lightness band, chroma floor, colorblind separation (worst pair ΔE
13.0), and normal-vision separation (worst pair ΔE 15.6) all pass on the light
surface. Orange is deliberately *not* in that set — it is reserved as the brand
accent for chrome, active states, bucket headers, and measure callouts.

Aqua sits below 3:1 contrast against the page surface, so every bubble carries a
visible text label and the table view exists — the required relief.

## Source of truth

All goal text is transcribed from `resources/2026-2027_Goals_Chart.pdf` into
[`lib/goals.ts`](lib/goals.ts), which is the single place to edit content. The
Board of Education presentation planning notes at the end of that PDF are not
part of this view. Scorecard bucket names and descriptions come from
`resources/Scorecard.jpg`.

Goals whose titles say K-12 are tagged for all six schools, and K-5 goals for the
four elementary schools, so a school filter surfaces the district-wide work that
lands in that building.

Everything editorial — themes, per-goal scorecard buckets, data points — lives in
[`lib/classifications.ts`](lib/classifications.ts), deliberately separate from the
transcription.

## Structure

```
app/
  page.tsx                  entry
  layout.tsx                document shell
  globals.css               all styling and design tokens
  components/
    Explorer.tsx            toolbar, lens picker, filters, search, view switching
    BubbleMap.tsx           the SVG bubble map, dragging, expand/collapse
    DetailDrawer.tsx        goal detail panel
    GoalTable.tsx           table view, bucketed by lens
lib/
  goals.ts                  the goal data, transcribed (edit content here)
  classifications.ts        editorial themes / scorecard / data points
  lenses.ts                 the organizing principles and their regions
  layout.ts                 region layout, force packing, label wrapping
```

Adding a goal means appending to `GOALS` in `lib/goals.ts` and adding a matching
entry to `CLASSIFICATIONS`. Region sizing, packing, header counts, and the table
buckets all derive from the data. Adding a whole new organizing principle means
adding one entry to `LENSES`.
