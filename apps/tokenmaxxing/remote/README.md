# Remote usage dashboard

View Tokenmaxxing usage from any machine on your network.

## 1. Run the app on the server

Once the app is running, its local API is available at `http://127.0.0.1:6736` on every OS — both the Bun proxy and this dashboard work the same against a Linux or a Windows host.

**Linux server** — install the `.deb`/`.rpm`/AppImage from the [latest release](https://github.com/falkoro/tokenmaxxing/releases/latest), then start the app headless:

```bash
xvfb-run -a tokenmaxxing
```

The tray app needs an X display; trayless headless mode is future work.

**Windows host** — install the [setup .exe](https://github.com/falkoro/tokenmaxxing/releases/latest) and run the app; it sits in the system tray. For an always-on setup, add it to startup (`Win+R` → `shell:startup`) or a Task Scheduler task running at log on. Windows has no Xvfb equivalent, so the machine needs a logged-in session (auto-logon or a disconnected RDP session both work).

## 2. Serve the remote dashboard

On the same machine (requires [Bun](https://bun.sh) — `irm bun.sh/install.ps1 | iex` on Windows):

```bash
bun remote/serve.ts
```

Optionally set a shared secret:

```bash
DASH_TOKEN=my-secret bun remote/serve.ts
```

Open `http://<server>:6737` from any machine (e.g. a Windows workstation). If `DASH_TOKEN` is set, pass it as `Authorization: Bearer <token>` or `?token=<token>`.

## 3. Alternative: SSH tunnel (no open port)

If you prefer not to expose port 6737:

```bash
ssh -L 6736:127.0.0.1:6736 user@server
```

Then open `remote/index.html?api=http://127.0.0.1:6736` locally in a browser.

## Security

Usage data and plan names are sensitive-ish. Prefer `DASH_TOKEN` or the SSH tunnel over exposing the dashboard unauthenticated. The upstream API at `:6736` is read-only and bound to loopback by default; the proxy only forwards `GET /v1/usage` requests.

## Windows as the viewer, the host, or both

- **Viewer**: just open `http://<host>:6737` in any browser — nothing to install.
- **Host**: run the app + `bun remote/serve.ts` on the Windows machine (see step 1) and view its usage from anywhere else.
- **Both**: install the native app to track the Windows machine's own usage locally, and use this dashboard for your other machines.