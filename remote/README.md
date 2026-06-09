# Remote usage dashboard

View Tokenmaxxing usage from any machine on your network.

## 1. Run the app on the Linux server

Install the `.deb` or `.rpm` package, then start the app headless:

```bash
xvfb-run -a tokenmaxxing
```

The tray app needs an X display; trayless headless mode is future work. Once running, the local API is available at `http://127.0.0.1:6736`.

## 2. Serve the remote dashboard

On the same server (requires [Bun](https://bun.sh)):

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

## Windows

A native Windows installer is available via CI artifacts if you want to track usage on the Windows machine itself rather than remote-viewing a Linux server.