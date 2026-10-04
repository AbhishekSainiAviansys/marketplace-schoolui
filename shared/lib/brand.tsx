/**
 * Shared branding. Sourced from Admin -> Settings via the PUBLIC endpoint
 * (GET /settings/public) so the Login page can render the logo before anyone
 * is authenticated. Mounted in every panel, so a logo/colour change in Admin
 * propagates to all three UIs.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, apiOrigin } from './api'

export type Brand = {
  appName: string
  logoUrl: string | null
  primary: string | null
}

const FALLBACK: Brand = { appName: 'Marketplace', logoUrl: null, primary: null }

const Ctx = createContext<Brand>(FALLBACK)

export const BrandProvider = ({ children }: { children: ReactNode }) => {
  const [brand, setBrand] = useState<Brand>(FALLBACK)

  useEffect(() => {
    let alive = true
    api
      .get('/settings/public')
      .then((r) => {
        if (!alive) return
        const d = r.data ?? {}
        const logo =
          typeof d.branding_logo === 'string' && d.branding_logo.trim() ? d.branding_logo.trim() : null
        const primary =
          typeof d.brand_primary === 'string' && /^#[0-9a-f]{3,8}$/i.test(d.brand_primary.trim())
            ? d.brand_primary.trim()
            : null
        setBrand({
          appName: (typeof d.app_name === 'string' && d.app_name.trim()) || FALLBACK.appName,
          logoUrl: logo,
          primary,
        })
      })
      .catch(() => {
        /* API offline - keep built-in defaults so the UI still renders */
      })
    return () => {
      alive = false
    }
  }, [])

  // Push the admin-chosen accent onto <html> so every `.accent-*` helper follows.
  useEffect(() => {
    const root = document.documentElement
    if (brand.primary) root.style.setProperty('--brand', brand.primary)
    else root.style.removeProperty('--brand')
  }, [brand.primary])

  return <Ctx.Provider value={brand}>{children}</Ctx.Provider>
}

export const useBrand = () => useContext(Ctx)

/** Turn a server-relative "/storage/..." path into a full URL on the API origin. */
export const assetUrl = (p: string | null) =>
  !p ? null : /^https?:\/\//i.test(p) ? p : `${apiOrigin()}${p}`

/** Initials fallback when there is no avatar image. */
export const initials = (name?: string | null) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?'
