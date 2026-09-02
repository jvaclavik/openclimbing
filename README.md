<div align="center">

# 🧗 OpenClimbing

### The climbing guide that belongs to everyone.

**Open climbing maps and interactive photo topos built on OpenStreetMap and Wikimedia Commons.**

Like Wikipedia, but for rock: climbing data lives in public databases that anyone can use, improve and build upon.

**Free. Open source. No ads. No paywall.**

<br>

[**🗺️ Explore OpenClimbing**](https://openclimbing.org) ·
[**💬 Community**](https://community.openclimbing.org) ·
[**❤️ Sponsor**](https://github.com/sponsors/jvaclavik)

<br>

[![GitHub Stars](https://img.shields.io/github/stars/jvaclavik/openclimbing?style=for-the-badge&logo=github&label=Stars)](https://github.com/jvaclavik/openclimbing/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/jvaclavik/openclimbing?style=for-the-badge&logo=github&label=Forks)](https://github.com/jvaclavik/openclimbing/forks)
[![License](https://img.shields.io/github/license/jvaclavik/openclimbing?style=for-the-badge)](./LICENSE.txt)

</div>

<br>

> [!IMPORTANT]
>
> ### ⭐ Like what we're building? Please star OpenClimbing.
>
> **Click the `⭐ Star` button at the top of this GitHub page.**
>
> It takes a second, costs nothing, and genuinely helps the project. More stars make OpenClimbing easier to discover, attract contributors and show that there is real interest in **open climbing data**.
>
> If you believe climbing knowledge should remain open, **your star is one of the easiest ways to support us. ❤️**

<br>

<div align="center">

<a href="https://openclimbing.org">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Openclimbing.org_-_map.png/960px-Openclimbing.org_-_map.png" width="900" alt="OpenClimbing climbing map">
</a>

<br><br>

<strong><a href="https://openclimbing.org">→ Open the climbing map</a></strong>

</div>

---

## The climbing guide that belongs to everyone

Most online climbing guides work the same way:

You contribute a route, photo or correction — and the information ends up inside a database controlled by one company.

**OpenClimbing is built differently.**

We don't want to build another proprietary climbing database.

Instead:

- 🗺️ **climbing areas and routes live in [OpenStreetMap](https://www.openstreetmap.org)**
- 📷 **climbing photos live in [Wikimedia Commons](https://commons.wikimedia.org)**
- 💻 **the OpenClimbing application itself is open source**

OpenClimbing brings these open datasets together and turns them into a modern climbing guide.

The important part is that **the data doesn't belong to us**.

Anyone can use it.
Anyone can improve it.
Anyone can build another app on top of it.

Even if OpenClimbing disappeared tomorrow, the climbing data would remain public.

### The data should outlive the app.

---

## What can you do with OpenClimbing?

<table>
<tr>
<td width="50%" valign="top">

### 🗺️ Explore climbing areas

Find crags, sectors, climbing routes, boulders and other climbing features directly on an interactive map.

</td>
<td width="50%" valign="top">

### 🧗 Browse interactive topos

See climbing routes drawn directly over real photographs instead of trying to match route names to a vague description.

</td>
</tr>

<tr>
<td width="50%" valign="top">

### ✏️ Edit the guide

Add new climbing areas, sectors and routes or improve existing ones.

Your edits become part of OpenStreetMap rather than disappearing into a private database.

</td>
<td width="50%" valign="top">

### 📷 Create photo topos

Upload climbing photos to Wikimedia Commons and draw exact route lines, bolts and anchors over them.

</td>
</tr>

<tr>
<td width="50%" valign="top">

### ☀️ Check sun & shade

See how the sun moves around a crag during the day and choose where to climb before leaving home.

</td>
<td width="50%" valign="top">

### 🏔️ Explore terrain in 3D

Tilt the map and understand the orientation, shape and surroundings of a climbing area.

</td>
</tr>

<tr>
<td width="50%" valign="top">

### 🤖 Detect bolts with AI

OpenClimbing can automatically recognize bolts on climbing photographs to make creating a topo faster.

</td>
<td width="50%" valign="top">

### 📱 Edit from your phone

The climbing editor works on mobile, so you can upload photos and improve climbing data directly at the crag.

</td>
</tr>

<tr>
<td width="50%" valign="top">

### 📄 Export offline PDF guides

Generate a guidebook for a climbing area and take it somewhere without mobile signal.

</td>
<td width="50%" valign="top">

### ✅ Log your ascents

Keep track of the routes you have climbed and see your climbing activity.

</td>
</tr>
</table>

---

## Open data, all the way down

OpenClimbing is primarily an **interface to open data**, not the owner of the climbing database.

|                          | What is stored there?                                          | Why?                                         |
| ------------------------ | -------------------------------------------------------------- | -------------------------------------------- |
| 🗺️ **OpenStreetMap**     | Crags, sectors, routes, grades, geometry and climbing metadata | Anyone can edit and reuse it                 |
| 📷 **Wikimedia Commons** | Climbing and topo photographs                                  | Photos remain part of a public media archive |
| 💻 **GitHub**            | The OpenClimbing application                                   | Anyone can inspect, improve or fork it       |

This also means OpenClimbing doesn't have to be the only climbing application using this information.

**That's the point.**

We want climbing data to become an open foundation that other developers, mappers, researchers, guidebook authors and climbers can build upon.

---

## Interactive photo topos

One of the things that makes OpenClimbing different is the ability to connect an OpenStreetMap climbing route with its **exact path on a photograph**.

We developed the [`wikimedia_commons:path`](https://wiki.openstreetmap.org/wiki/Key:wikimedia_commons:path) tagging scheme for this.

A route can reference a Wikimedia Commons image:

```text
wikimedia_commons = File:Roviste - Monolit.jpg
```

and describe its path over the image:

```text
wikimedia_commons:path = 0.682,0.823|0.642,0.453B|0.557,0.177A
```

The coordinates describe the route line while markers can describe features such as:

- `B` — bolt
- `A` — anchor
- `P` — piton
- `S` — fixed sling

The result is an interactive, machine-readable climbing topo built entirely from open data.

And because the specification is open, **other applications can render exactly the same topo.**

---

## Why open climbing data?

We think basic information about climbing routes should be open in much the same way as information about:

- streets,
- hiking trails,
- peaks,
- buildings,
- rivers,
- or geographical names.

A route's **name, grade, location and line** are part of our shared knowledge of the physical world.

Yet climbing information is often scattered across paper guidebooks, abandoned websites and proprietary databases.

That creates a few problems.

### Closed databases can disappear

A company shuts down.
An app stops being maintained.
A website disappears.

Years of community contributions can disappear with it.

### Contributors often don't own their contributions

A climber may spend hours documenting routes but cannot easily export or reuse that information elsewhere.

### Every new climbing app starts again

Instead of improving one shared source of information, developers repeatedly rebuild similar databases.

OpenClimbing tries a different approach:

> **Build the data together. Build as many apps as you want on top of it.**

OpenStreetMap and Wikimedia have shown that shared public knowledge can survive individual projects, companies and developers.

We want climbing data to work the same way.

---

## ⭐ Help OpenClimbing grow

OpenClimbing is still a relatively small open-source project.

That means something as simple as a GitHub star can make a surprisingly big difference.

### If you like the project:

**→ Click `⭐ Star` at the top of this repository.**

Stars help us:

- 📈 become more visible on GitHub,
- 🧑‍💻 attract new developers and contributors,
- 🧗 reach climbers who haven't heard about OpenClimbing,
- 🌍 show that people care about open climbing data,
- ❤️ stay motivated to keep building.

You don't need to contribute code.

**A star, a share or telling another climber about OpenClimbing already helps.**

---

## Get involved

OpenClimbing is a community project and there are many ways to contribute.

### 🧗 I'm a climber

Use [OpenClimbing](https://openclimbing.org), report missing or incorrect information and tell us what would make the app more useful at the crag.

### 🗺️ I'm a mapper

Add climbing areas and routes to OpenStreetMap, improve existing data and create photo topos.

Start here:

- [OpenStreetMap climbing documentation](https://wiki.openstreetmap.org/wiki/Climbing)
- [OpenClimbing OSM Wiki](https://wiki.openstreetmap.org/wiki/Openclimbing.org)
- [`wikimedia_commons:path`](https://wiki.openstreetmap.org/wiki/Key:wikimedia_commons:path)

### 📷 I'm a photographer

Upload useful climbing photographs to Wikimedia Commons and help turn them into open photo topos.

### 💻 I'm a developer

Bug fixes, UI improvements, refactoring and new features are welcome.

You can:

- [browse open issues](https://github.com/jvaclavik/openclimbing/issues),
- [start a discussion](https://github.com/jvaclavik/openclimbing/discussions),
- or simply open a pull request.

### 📣 I just like the idea

That's useful too.

**Star the repository and share OpenClimbing with someone who climbs.**

---

## ❤️ Support OpenClimbing

OpenClimbing is built in our spare time and given to everyone for free.

There are:

**no ads, no paywalls and no paid premium climbing data.**

We want to keep it that way.

Financial contributions help cover infrastructure, development tools and equipment and allow us to spend more time improving OpenClimbing and creating better open climbing data.

### Sponsor the project

[**❤️ GitHub Sponsors**](https://github.com/sponsors/jvaclavik) ·
[**☕ Buy Me a Coffee**](https://buymeacoffee.com/openclimbing.org) ·
[**More ways to contribute**](https://openclimbing.org/about)

You can also support us without spending anything:

⭐ **Star OpenClimbing**
📣 Share the project
🗺️ Improve the data
📷 Add climbing photos
💻 Send a pull request

Every contribution helps.

**OpenClimbing will remain open whether you sponsor us or not.**

---

## Run OpenClimbing locally

### Requirements

- [Node.js](https://nodejs.org/) **22**
- [Yarn](https://yarnpkg.com/)

Clone the repository:

```bash
git clone https://github.com/jvaclavik/openclimbing.git
cd openclimbing
```

Enable Corepack and install dependencies:

```bash
corepack enable
yarn
```

Start the development server:

```bash
yarn dev
```

Then open:

```text
http://localhost:3000
```

### Useful commands

```bash
yarn dev
yarn test
yarn lint
yarn build
```

---

## Tech stack

OpenClimbing is mainly built with:

- **TypeScript**
- **React**
- **Next.js**
- **MapLibre GL**
- **Material UI**
- **OpenStreetMap**
- **Wikimedia Commons**

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for more information about the application architecture.

---

## Project roots

OpenClimbing originally grew out of [OsmAPP](https://github.com/zbycz/osmapp), an open-source universal OpenStreetMap application.

The project was separated to allow OpenClimbing to evolve faster around the specific needs of climbers while keeping the same open-data philosophy.

Huge thanks to everyone who has contributed to OsmAPP, OpenStreetMap, Wikimedia Commons and the wider open-source ecosystem that makes this project possible.

---

## Useful links

- 🧗 [openclimbing.org](https://openclimbing.org)
- ❤️ [Support OpenClimbing](https://openclimbing.org/about)
- 💬 [OpenClimbing Community](https://community.openclimbing.org)
- 🗺️ [OpenClimbing on the OpenStreetMap Wiki](https://wiki.openstreetmap.org/wiki/Openclimbing.org)
- 📖 [OSM climbing tagging](https://wiki.openstreetmap.org/wiki/Climbing)
- 📷 [`wikimedia_commons:path`](https://wiki.openstreetmap.org/wiki/Key:wikimedia_commons:path)
- 🐛 [GitHub Issues](https://github.com/jvaclavik/openclimbing/issues)
- 💡 [GitHub Discussions](https://github.com/jvaclavik/openclimbing/discussions)
- 📖 [The story behind OpenClimbing](https://medium.com/@jvaclavik/story-behind-openclimbing-org-ab448939c6ac)
- 🗺️ [How to contribute a climbing crag](https://medium.com/@jvaclavik/how-to-contribute-to-openclimbing-org-9a159ddd5d4c)

---

## License

OpenClimbing is open-source software licensed under the [GNU GPL-3.0](./LICENSE.txt).

Climbing data and photographs remain subject to the licenses of their respective sources, including OpenStreetMap and Wikimedia Commons.

---

<div align="center">

## Climbing knowledge should be open. 🧗🌍

If you agree, help us make OpenClimbing easier to discover.

### ⭐ Star this repository

**Just click the `Star` button at the top of the page.**

It really helps. ❤️

<br>

[**🗺️ Explore OpenClimbing**](https://openclimbing.org) ·
[**❤️ Become a sponsor**](https://github.com/sponsors/jvaclavik) ·
[**💬 Join the community**](https://community.openclimbing.org)

<br>

Made by climbers, for climbers — and for everyone who believes shared knowledge should stay open.

</div>
