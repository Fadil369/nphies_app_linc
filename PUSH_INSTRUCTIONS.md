# Pushing to your remote repository

If you have a remote repository ready (GitHub, GitLab, etc.), run the following from the repo root.

1. Add remote and push:

```bash
git remote add origin https://github.com/<your-org>/<your-repo>.git
git push -u origin main
```

1. If `origin` already exists and you want to update it:

```bash
# Rename existing remote (safe):
git remote rename origin origin-old
# Add new remote
git remote add origin https://github.com/<your-org>/<your-repo>.git
git push -u origin main
```

1. If the push is rejected due to unrelated history and you are sure you want to overwrite remote:

```bash
git push -u origin main --force
```

Note: Pushing requires authentication via HTTPS (username/password or PAT) or SSH keys.
