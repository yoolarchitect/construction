# Domain setup: dhisme.so on Vercel

You bought **dhisme.so** from SOSTEC and host the app on Vercel.  
**DNS_PROBE_FINISHED_NXDOMAIN** means the domain is not yet pointing to Vercel. Do the steps below.

---

## 1. Add domains in Vercel

1. Open your project on [Vercel Dashboard](https://vercel.com/dashboard) → **Settings** → **Domains**.
2. Click **Add** and add:
   - **dhisme.so** (main/apex – for admin at `https://dhisme.so/admin`)
   - **\*.dhisme.so** (wildcard – for tenants like `https://acme.dhisme.so`)

3. For **wildcard** domains, Vercel requires **nameservers** (see step 2). You will see instructions and the nameservers to use.

---

## 2. Point dhisme.so to Vercel (at SOSTEC)

You must tell SOSTEC to use **Vercel’s nameservers** so that both `dhisme.so` and `*.dhisme.so` work.

1. Log in where you manage **dhisme.so** (SOSTEC / your registrar).
2. Find **DNS** or **Nameservers** (often under “Domain management”, “DNS settings”, or “Nameserver”).
3. **Replace** the current nameservers with Vercel’s:
   - **ns1.vercel-dns.com**
   - **ns2.vercel-dns.com**

4. Save and wait. DNS can take from a few minutes up to 24–48 hours.

> **Important:** For wildcard domains like `*.dhisme.so`, Vercel only supports setup via **nameservers**, not only A/CNAME records. So you must switch to Vercel’s nameservers.

---

## 3. (Optional) Keep using SOSTEC DNS

If you cannot or don’t want to change nameservers to Vercel:

- **Wildcard `*.dhisme.so` will not work** with Vercel when DNS stays at SOSTEC (Vercel requires nameservers for wildcards).
- You can still point only the **apex** `dhisme.so` (and maybe `www.dhisme.so`) via A/CNAME at SOSTEC, but then **tenant subdomains** (e.g. `acme.dhisme.so`) will not resolve to Vercel unless you add each subdomain manually as a CNAME at SOSTEC (not ideal for many tenants).

**Recommended:** Use Vercel nameservers so both `dhisme.so` and `*.dhisme.so` work automatically.

---

## 4. Environment on Vercel

In the Vercel project:

- **Settings → Environment Variables**
- Add:
  - **PLATFORM_DOMAIN** = `dhisme.so` (no `https://`, no port)

---

## 5. Check that it works

After DNS has propagated:

- **https://dhisme.so** → platform (admin login, tenant management).
- **https://dhisme.so/login** → platform admin login.
- **https://[tenant-slug].dhisme.so** (e.g. a tenant you created) → tenant login.
- **https://[unknown].dhisme.so** (subdomain with no tenant) → redirects to **https://dhisme.so/contact** (contact page with +252907700949).

If it still says “This site can’t be reached” or **DNS_PROBE_FINISHED_NXDOMAIN**, wait a bit longer for DNS or double‑check that the nameservers for **dhisme.so** are exactly **ns1.vercel-dns.com** and **ns2.vercel-dns.com** at SOSTEC.
