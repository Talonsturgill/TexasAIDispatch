"""Reachability tests: history and abandoned phase files cannot silently wire production."""
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import wiring_check as w

class RoutineLoadingTest(unittest.TestCase):
    def test_only_reachable_phases_count(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td);prompts=root/"prompts";(prompts/"phases").mkdir(parents=True)
            (prompts/"dispatch_routine.md").write_text("Read prompts/phases/one.md\n")
            (prompts/"phases/one.md").write_text("Run scripts/real.py\nRead prompts/dispatch_routine.md\n")
            (prompts/"phases/abandoned.md").write_text("Run scripts/abandoned.py\n")
            (root/"knowledge").mkdir();(root/"knowledge/history.md").write_text("Run scripts/old.py\n")
            with patch.object(w,"REPO",root):
                text=w.prompt_text()
                self.assertIn("scripts/real.py",text)
                self.assertNotIn("scripts/abandoned.py",text)
                self.assertNotIn("scripts/old.py",text)
                (prompts/"phases/one.md").unlink()
                with self.assertRaisesRegex(ValueError,"missing"):w.prompt_text()

if __name__=="__main__":unittest.main()
