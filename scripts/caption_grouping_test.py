"""Measured caption edges must survive readable grouping."""
import unittest
from vo_align import cues, distribute


def measured_runs(texts):
    words = []
    for i, text in enumerate(texts):
        run = distribute(text.split(), i * 2.0, i * 2.0 + 1.4)
        run[0]["anchored_start"] = True
        run[-1]["anchored_end"] = True
        words.extend(run)
    return words


class GroupingTests(unittest.TestCase):
    def check_runs(self, texts, expected):
        words = measured_runs(texts)
        result = cues(words)
        self.assertEqual(len(result), expected)
        self.assertEqual(" ".join(c["text"] for c in result), " ".join(w["word"] for w in words))
        self.assertTrue(all(c["start_measured"] and c["end_measured"] for c in result))
        self.assertTrue(all(c["start"] in [w["start"] for w in words if w["anchored_start"]]
                            and c["end"] in [w["end"] for w in words if w["anchored_end"]]
                            for c in result))
        return result

    def test_site_sentence(self):
        self.check_runs(["In the Texas Panhandle,", "Southwestern Public Service says its AI cameras are meant to identify fires."], 2)

    def test_report_sentence(self):
        self.check_runs(["The utility's May report,", "covering part of last year,", "instead lists thirty-three cameras installed."], 2)

    def test_indivisible_long_run(self):
        result = self.check_runs(["word " * 30], 1)
        self.assertGreater(len(result[0]["text"]), 88)

    def test_short_run(self):
        self.check_runs(["Smoke is the signal."], 1)


if __name__ == "__main__":
    unittest.main()
