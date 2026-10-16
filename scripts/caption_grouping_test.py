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

    def test_current_profile_prefers_a_measured_clause_break(self):
        words = measured_runs(['At a low-water crossing in Texas,',
                               'a sensor can report a rising creek.'])
        result = cues(words, compact=True)
        self.assertEqual([c['text'] for c in result],
                         ['At a low-water crossing in Texas,', 'a sensor can report a rising creek.'])
        self.assertEqual(len(cues(words)), 1)
        self.assertTrue(all(c['start_measured'] and c['end_measured'] for c in result))

    def test_current_profile_reduces_early_reveal_without_changing_words_or_edges(self):
        words = measured_runs(['The gauge detects rising water', 'and sends a signal',
                               'through a nearby wireless relay.'])
        result = cues(words, compact=True)
        legacy = cues(words)
        self.assertLess(max(c['end'] - c['start'] for c in result),
                        max(c['end'] - c['start'] for c in legacy))
        self.assertEqual(' '.join(c['text'] for c in result), ' '.join(w['word'] for w in words))
        starts = {w['start'] for w in words if w['anchored_start']}
        ends = {w['end'] for w in words if w['anchored_end']}
        self.assertTrue(all(c['start'] in starts and c['end'] in ends for c in result))

    def test_current_profile_never_invents_an_indivisible_run_boundary(self):
        words = measured_runs(['A continuous unbroken measured passage ' * 5])
        result = cues(words, compact=True)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['start'], words[0]['start'])
        self.assertEqual(result[0]['end'], words[-1]['end'])

    def test_current_profile_keeps_the_article_with_its_measured_noun_phrase(self):
        words = []
        for text, start, end in [('At the crossing the gauge detects the', 0.0, 3.5),
                                  ('rising water.', 3.6, 3.9)]:
            run = distribute(text.split(), start, end)
            run[0]['anchored_start'] = True
            run[-1]['anchored_end'] = True
            words.extend(run)
        result = cues(words, compact=True)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['text'], 'At the crossing the gauge detects the rising water.')
        self.assertEqual((result[0]['start'], result[0]['end']), (0.0, 3.9))


if __name__ == "__main__":
    unittest.main()
