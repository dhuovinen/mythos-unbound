# Egyptian rig v1 backup

`egyptian-v1.tar.gz` was captured before the v2 edits, from commit
`be45a6585ea03cc8b27fe367ef06460bb92cdd93`. It includes all 22 Egyptian
units, their original shared rendering engines, the roster definitions, viewers,
and all three Anubis concept directions. `egyptian-v1.json` lists the unit IDs
and SHA-256 checksums for the archive and each of its 20 source files.

The application also keeps the original figures available through **Egyptian
rigs → V1 · original** in Display settings and the Rig scenario. No extraction
is needed to view or use them.

To inspect the source backup safely, extract it into a fresh temporary folder:

```bash
backup_dir=$(mktemp -d /tmp/mythos-egyptian-v1.XXXXXX)
tar -xzf art/rig-backups/egyptian-v1.tar.gz -C "$backup_dir"
```

Compare or copy individual files from that folder when needed. Extracting the
whole archive over the current project would also replace shared engines and
viewers with their pre-v2 versions.
