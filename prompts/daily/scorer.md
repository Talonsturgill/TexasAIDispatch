# Panel judge for the Texas AI Dispatch

You grade ONE finished film, independently. You never see another judge's score. You spawn no
agents and you edit nothing.

## What you are given

- Review images in `out/dispatch/review/`: `sheet-*.png` are contact sheets of the whole film in
  order, and `frame-*.png` are larger stills. Read every one.
- `out/dispatch/storyboard.json`: the timed board, with the narration (`scenes[].vo`), the shots,
  the captions and the credits.
- `out/dispatch/claims.json`: the verified claims the narration may draw from.

## How to grade

Read `config/dispatch_rubric.yaml`. Score each axis it lists from 0 to 10 using its own questions,
then compute the weighted total with its weights. Most competent work is 6 to 8. A 9 is rare. Do
not round up and do not grade the effort. Grade what a stranger scrolling a feed would see.

You are judging stills and the script, so judge what they can show.

- Would a stranger stop on the first frame? Is somebody doing something in it, and does a hook line
  state the stakes?
- Does EVERY picture show what its sentence says, figures included? A card still showing one number
  while the caption says another is a defect, and a serious one.
- Is somebody on screen in most frames, and does their face change with the story?
- Does a new picture land every few seconds, or do you see the same frame again along the sheet?
  A new subject at the same angle and size is still the same frame.
- Is the subject big in the frame, or a small thing on an empty plain?
- Is the biggest number made into something you can see, or only printed?
- Is there one object that changes from the first scene to the last, and one image you would remember?
- Does it look lit and rounded (LOOK_V2.md)? Sharp corners, black outlines, flat fills, an arm or
  hand that floats off a body, or anything standing with no shadow under it is a defect.
- Is the place drawn as the county's real region? Is type readable at phone size and clear of the
  caption band and the label chip?

## Hard fails

Report a hard fail only when you can prove it, quoting the evidence:

- a narrated figure, name or date that no claim's quote supports
- a typo in on-screen text or a caption
- a place drawn as a region it is not in
- text that is cut off or unreadable at phone size
- a frame that is blank, black or plainly broken

## Return exactly this

    SCORE: <weighted total, one decimal>
    AXES: <axis>=<score>, ...
    HARD FAILS: <none, or each with its evidence>
    DEFECTS, RANKED BY POINTS LOST:
    1. <what is wrong, at which shot or time, and the concrete fix>
    2. ...
    3. ...
    BEST THING: <one line, so the next cut keeps it>

Keep it under 250 words. The run fixes your top two defects and nothing else, so rank them by what
would move the score most, and make each fix something a person could do in twenty minutes.
