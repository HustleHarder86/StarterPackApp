# Mockup Iteration System

## 🚀 Quick Start

You're all set! This folder has git version control for fast iteration on your mockup.

### Main File
- `base-mockup.html` - Your working mockup file

### Super Fast Workflow

1. **Make changes** to `base-mockup.html` in VSCode
2. **Save checkpoint** when you like something:
   ```bash
   git add . && git commit -m "added cool feature"
   ```
3. **Keep iterating** - make more changes
4. **Don't like the last change?**
   ```bash
   git reset --hard HEAD~1
   ```

## 🎯 Essential Commands

### Save Current State
```bash
git add . && git commit -m "description"
```

### View Version History
```bash
git log --oneline
```

### Go Back Versions
```bash
git reset --hard HEAD~1    # Go back 1 version
git reset --hard HEAD~3    # Go back 3 versions
```

### See What Changed
```bash
git diff                   # Current changes
git diff HEAD~1           # What changed in last version
```

## 💡 Pro Workflow

### Load Quick Commands
```bash
source quick-commands.sh
```

Then use shortcuts:
- `save "added nav"` - Quick save
- `versions` - See history
- `back` - Undo last version
- `backto 3` - Go back 3 versions

### Create Checkpoints
Before major experiments:
```bash
git tag -a "before-big-change" -m "Checkpoint"
```

Return to checkpoint:
```bash
git checkout "before-big-change"
```

## 📝 Current Status

- **Created**: August 10, 2025
- **Base mockup**: Recovered from August 8 work
- **Purpose**: Fast iteration on STR analysis mockup

## 🔄 VSCode Integration

1. Open this folder in VSCode
2. Use Source Control panel (Ctrl+Shift+G) to:
   - See changes visually
   - Commit with UI
   - Browse history
   - Revert specific changes

## ⚡ Speed Tips

1. **Commit often** - Every small win
2. **Don't worry about message quality** - Just describe what you did
3. **Use VSCode's diff view** - See exactly what changed
4. **Branch for experiments** - `git checkout -b crazy-idea`

---

Remember: This is all LOCAL - no GitHub needed. Super fast iteration!