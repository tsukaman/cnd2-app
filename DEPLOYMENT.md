# CND² Deployment Guide

## 🚀 Deployment to Cloudflare Pages

This application is configured for deployment to Cloudflare Pages with automatic CI/CD via GitHub Actions.

## Prerequisites

1. **Cloudflare Account**: You need a Cloudflare account with Pages enabled
2. **GitHub Repository**: The code should be hosted on GitHub
3. **API Keys**: Required environment variables (see below)

## Environment Variables

### Required for Production

```env
# Application URL
NEXT_PUBLIC_APP_URL=https://cdn2.cloudnativedays.jp

# OpenAI API Key (for diagnosis generation)
OPENAI_API_KEY=your_openai_api_key_here

# Prairie Card API Base URL
PRAIRIE_CARD_BASE_URL=https://prairie-card.cloudnativedays.jp
```

### Required for GitHub Actions

Set these as GitHub Secrets:

- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with Pages:Edit permission
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
- `OPENAI_API_KEY`: OpenAI API key for the build process

## Manual Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Build for Production

```bash
npm run build
```

This will create an `out` directory with the static files.

### 3. Deploy to Cloudflare Pages

#### Using Wrangler CLI

```bash
npx wrangler pages deploy out --project-name=cnd2-app
```

#### Using Cloudflare Dashboard

1. Go to Cloudflare Dashboard > Pages
2. Create a new project or select existing "cnd2-app"
3. Upload the `out` directory

## Automatic Deployment (CI/CD)

The project is configured with GitHub Actions for automatic deployment:

### Workflows

1. **CI Pipeline** (`.github/workflows/ci.yml`)
   - Runs on every push and pull request
   - Executes: Lint, Test, Type Check, Build
   - Uploads build artifacts

2. **Deploy Pipeline** (`.github/workflows/deploy.yml`)
   - Runs on push to `main` branch
   - Builds and deploys to Cloudflare Pages
   - Automatic deployment to production

### Setting Up CI/CD

1. **Add GitHub Secrets**:
   ```
   Settings > Secrets and variables > Actions > New repository secret
   ```
   Add the required secrets mentioned above.

2. **Enable GitHub Actions**:
   - Actions should be enabled by default
   - Check Settings > Actions > General

3. **First Deployment**:
   - Push to `main` branch
   - Monitor the Actions tab for deployment status

## Domain Configuration

### Custom Domain Setup

1. In Cloudflare Pages dashboard:
   - Go to your project > Custom domains
   - Add `cdn2.cloudnativedays.jp`

2. DNS Configuration:
   ```
   Type: CNAME
   Name: cdn2
   Target: cnd2-app.pages.dev
   ```

### SSL/TLS

- Cloudflare Pages automatically provisions SSL certificates
- Ensure SSL/TLS mode is set to "Full" or "Full (strict)"

## Monitoring

### Build Status

- Check GitHub Actions tab for build status
- Badge: `![Deploy](https://github.com/[username]/cnd2-app/actions/workflows/deploy.yml/badge.svg)`

### Performance Monitoring

- Use Cloudflare Analytics for traffic and performance metrics
- Lighthouse CI can be added to the pipeline for performance tracking

## Rollback

### Via Cloudflare Dashboard

1. Go to Pages > Your project > Deployments
2. Find the previous successful deployment
3. Click "Rollback to this deployment"

### Via Git

```bash
git revert HEAD
git push origin main
```

## Troubleshooting

### Build Failures

1. **Check logs**: GitHub Actions > Failed workflow > Job logs
2. **Common issues**:
   - Missing environment variables
   - Linting errors (can be bypassed with `continue-on-error`)
   - Type errors (check `npm run tsc`)

### Deployment Failures

1. **Verify API tokens**: Ensure Cloudflare tokens have correct permissions
2. **Check account ID**: Verify the Cloudflare account ID is correct
3. **Build output**: Ensure `out` directory is created properly

### Runtime Issues

1. **API Routes**: Static export doesn't support API routes - use Edge Functions
2. **Dynamic Routes**: Ensure all dynamic routes are pre-rendered
3. **Environment Variables**: Only `NEXT_PUBLIC_*` variables are available client-side

## Local Testing

### Test Production Build Locally

```bash
# Build
npm run build

# Serve locally
npx serve out -p 3000
```

### Test with Wrangler

```bash
npx wrangler pages dev out
```

## Security Considerations

1. **API Keys**: Never commit API keys to the repository
2. **Environment Variables**: Use GitHub Secrets for sensitive data
3. **Headers**: Security headers are configured in `wrangler.toml`
4. **CORS**: Configure CORS properly for API endpoints

## Performance Optimization

1. **Static Generation**: Use `getStaticProps` when possible
2. **Image Optimization**: Use Next.js Image component
3. **Bundle Size**: Monitor with `npm run analyze`
4. **Caching**: Leverage Cloudflare's CDN caching

## Support

For issues or questions:
- GitHub Issues: [Create an issue](https://github.com/[username]/cnd2-app/issues)
- Cloudflare Support: [Pages Documentation](https://developers.cloudflare.com/pages/)