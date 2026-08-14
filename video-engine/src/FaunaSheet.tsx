import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Grackle, Mockingbird, Armadillo, Pronghorn, TurkeyVulture, Longhorn, Whitetail,
  Jackrabbit, Roadrunner, CattleEgret, HornedLizard, FeralHog, Javelina, Coyote,
  BatColumn, herdHides} from './lib/fauna';
import {Character, castProps} from './lib/Character';
import {RegionLight, GradeLayer, INK} from './lib/lighting';
import {M} from './lib/scale';

// A contact sheet of the bestiary, for LOOKING at. Not a scene.
//
// Every entry in knowledge/texas/FAUNA_AND_FLORA.md leads with THE MISTAKE, and a
// typecheck cannot tell you whether the correction actually reads. So this sheet
// stages the exact poses the corrections are about: the armadillo at the top of its
// vertical leap, the pronghorn going UNDER a real drawn fence, the longhorn's horns
// against its own shoulder height, a herd whose hides genuinely differ.
//
// It also carries a SCALE ROW with a person in it, because true size is the thing
// fauna.tsx is built on and an unchecked conversion is only a comment.
//
// It is 3200 tall on purpose. The first version squeezed everything into 1920 and
// four rows collided so badly that half the sheet could not be read at all, which
// made it useless for the one job it has. A review surface is allowed to be as big
// as the thing it reviews.
//
// If a claim in a comment is wrong, it is wrong HERE, visibly.
//
// staging-check: exempt — a reference sheet, not a scene. Every species is shown
// under ONE light so the drawings can be compared against each other, which is the
// sheet's whole purpose and is exactly what the placement rule forbids in a scene.
// Coverage and true-scale still run against fauna.tsx itself, and those are the two
// that catch the quiet failures. The exemption was earned rather than assumed: run
// against this file the check named a javelina and a cattle egret in the Rolling
// Plains, both correct, and an armadillo and a feral hog that turned out to be wrong
// in the HABITAT map rather than wrong on the sheet.

const Row: React.FC<{
  ground: number; title: number; head: string; note: string; children: React.ReactNode;
}> = ({ground, title, head, note, children}) => (
  <g>
    <text x={40} y={title} fontSize={21} fontWeight={700} fill={INK}
      fontFamily="Georgia, serif">{head}</text>
    <text x={40} y={title + 21} fontSize={13} fill="#6a6a6a" fontFamily="Georgia, serif">{note}</text>
    <line x1={40} y1={ground} x2={1040} y2={ground} stroke="#cdbfa8" strokeWidth={2} />
    {children}
  </g>
);

const Cap: React.FC<{x: number; y: number; children: string}> = ({x, y, children}) => (
  <text x={x} y={y + 21} fontSize={12.5} fill="#7a7266" textAnchor="middle"
    fontFamily="Georgia, serif">{children}</text>
);

export const FaunaSheet: React.FC = () => {
  const f = useCurrentFrame();
  const hides = herdHides(5, 3);
  return (
    <svg width={1080} height={3200} viewBox="0 0 1080 3200" style={{background: '#efe7da'}}>
      <RegionLight region="rolling_plains">
        <text x={40} y={58} fontSize={42} fontWeight={700} fill={INK}
          fontFamily="Georgia, serif">The bestiary</text>
        <text x={40} y={88} fontSize={17} fill="#5a5a5a" fontFamily="Georgia, serif">
          Fifteen species at true size, staged in the poses their corrections are about.
        </text>

        {/* THE SCALE ROW. Everything on this sheet is drawn at the same scale as this
            person, so the sizes are checkable rather than asserted. */}
        <Row ground={400} title={150} head="True scale, against a person"
          note="One scale value means one thing across the whole file. Nothing here is sized by eye.">
          <Character {...castProps('rancher')} frame={f} x={80} y={400} scale={0.3}
            pose="stand" emotion="neutral" />
          <Longhorn x={300} y={400} frame={f} scale={0.3} seed={5} hide={hides[0]} />
          <Whitetail x={560} y={400} frame={f} scale={0.3} seed={9} points={8} />
          <FeralHog x={720} y={400} frame={f} scale={0.3} seed={12} boar />
          <Coyote x={840} y={400} frame={f} scale={0.3} seed={14} trotting />
          <Javelina x={940} y={400} frame={f} scale={0.3} seed={13} />
          <Armadillo x={1000} y={400} frame={f} scale={0.3} seed={2} />
          <Cap x={80} y={400}>1.70 m</Cap>
          <Cap x={300} y={400}>longhorn</Cap>
          <Cap x={560} y={400}>whitetail</Cap>
          <Cap x={720} y={400}>feral hog</Cap>
          <Cap x={840} y={400}>coyote</Cap>
          <Cap x={930} y={422}>javelina</Cap>
          <Cap x={995} y={400}>armadillo</Cap>
        </Row>

        <Row ground={660} title={490} head="Great-tailed grackle, and the mockingbird"
          note="The grackle tail is a long vertical BLADE, never fanned, and held clear of the ground. The mockingbird's white wing flash IS the bird.">
          <Grackle x={160} y={660} frame={f} scale={1.7} seed={11} />
          <Grackle x={330} y={660} frame={f} scale={1.7} seed={12} female />
          <Grackle x={520} y={660} frame={f} scale={1.7} seed={13} calling tailUp />
          <Mockingbird x={680} y={660} frame={f} scale={1.7} seed={14} />
          <Mockingbird x={820} y={660} frame={f} scale={1.7} seed={15} singing />
          <Mockingbird x={960} y={660} frame={f} scale={1.7} seed={16} flashing />
          <Cap x={160} y={660}>male</Cap>
          <Cap x={330} y={660}>female</Cap>
          <Cap x={520} y={660}>calling, tail cocked</Cap>
          <Cap x={680} y={660}>perched</Cap>
          <Cap x={820} y={660}>singing</Cap>
          <Cap x={960} y={660}>wing flash</Cap>
        </Row>

        <Row ground={960} title={720} head="Armadillo"
          note="Housecat-sized, and it JUMPS STRAIGHT UP. That leap is why they die on highways, and the shadow stays on the ground while it happens.">
          <Armadillo x={250} y={960} frame={f} scale={1.05} seed={21} />
          <Armadillo x={545} y={960} frame={f} scale={1.05} seed={22} leap={0.5} />
          <Armadillo x={850} y={960} frame={f} scale={1.05} seed={23} rooting />
          <Cap x={250} y={960}>at rest</Cap>
          <Cap x={545} y={960}>top of the leap</Cap>
          <Cap x={850} y={960}>rooting</Cap>
        </Row>

        <Row ground={1310} title={1030} head="Black-tailed jackrabbit"
          note="A hare, not a rabbit, and the ears are the animal. It LOPES, ears back. Backlit, the vessels light up.">
          <Jackrabbit x={180} y={1310} frame={f} scale={1.25} seed={24} />
          <Jackrabbit x={480} y={1310} frame={f} scale={1.25} seed={25} backlit />
          <Jackrabbit x={800} y={1310} frame={f} scale={1.25} seed={26} loping />
          <Cap x={180} y={1310}>ears up</Cap>
          <Cap x={480} y={1310}>backlit</Cap>
          <Cap x={800} y={1310}>loping, ears back</Cap>
        </Row>

        <Row ground={1690} title={1380} head="Pronghorn"
          note="Goes UNDER a fence, never over. The fence is drawn to a real net-wire height, so the crouch is testable rather than asserted.">
          <Pronghorn x={150} y={1690} frame={f} scale={0.55} seed={31} />
          <Pronghorn x={430} y={1690} frame={f} scale={0.55} seed={32} alarmed />
          <Pronghorn x={620} y={1690} frame={f} scale={0.55} seed={34} doe />
          {/* a real five-wire fence: the top wire of a Texas net fence sits about
              1.2 m, so every wire here is placed in metres and converted, not eyeballed */}
          <g>
            {[0.16, 0.38, 0.62, 0.88, 1.18].map((mh) => {
              const wy = 1690 - mh * M * 0.55;
              return <line key={mh} x1={745} y1={wy} x2={995} y2={wy}
                stroke="#8a7658" strokeWidth={1.8} />;
            })}
            {[770, 880, 990].map((px) => (
              <line key={px} x1={px} y1={1691} x2={px} y2={1690 - 1.24 * M * 0.55}
                stroke="#5f4f38" strokeWidth={4} />
            ))}
          </g>
          <Pronghorn x={830} y={1690} frame={f} scale={0.55} seed={33} underFence={1} />
          <Cap x={150} y={1690}>buck, standing</Cap>
          <Cap x={430} y={1690}>alarmed, rump flared</Cap>
          <Cap x={620} y={1690}>doe</Cap>
          <Cap x={860} y={1690}>under the bottom wire</Cap>
        </Row>

        <Row ground={2010} title={1760} head="Longhorn: the herd"
          note="Hides drawn WITHOUT replacement, because a herd of identical longhorns is the tell and that is a property of the set, not of one animal.">
          {hides.map((h, i) => (
            <Longhorn key={i} x={130 + i * 176} y={2010} frame={f} scale={0.28}
              seed={51 + i * 7} hide={h} horn={0.55 + i * 0.16} grazing={i === 1 || i === 4} />
          ))}
          <Cap x={130} y={2010}>young</Cap>
          <Cap x={834} y={2010}>mature steer</Cap>
        </Row>

        <Row ground={2350} title={2080} head="The working pasture"
          note="The horns are WIDER than the animal is tall, and the head turns three-quarter or they foreshorten to nothing. The egret rides the back.">
          <Longhorn x={280} y={2350} frame={f} scale={0.38} seed={71} hide={hides[1]} horn={1} />
          <CattleEgret x={250} y={2255} frame={f} scale={0.38} seed={72} breeding />
          <Whitetail x={640} y={2350} frame={f} scale={0.38} seed={73} points={10} />
          <Whitetail x={900} y={2350} frame={f} scale={0.38} seed={74} flagging facing={-1} />
          <Cap x={280} y={2350}>mature steer, egret riding</Cap>
          <Cap x={640} y={2350}>ten-point buck</Cap>
          <Cap x={900} y={2350}>doe, flagging</Cap>
        </Row>

        <Row ground={2640} title={2420} head="Roadrunner, javelina, horned lizard"
          note="A ground cuckoo and a predator. A javelina is NOT a pig. The horned lizard is the state reptile and it is declining, so putting one in a frame is a statement.">
          <Roadrunner x={130} y={2640} frame={f} scale={1.15} seed={61} />
          <Roadrunner x={370} y={2640} frame={f} scale={1.15} seed={62} running />
          <Javelina x={620} y={2640} frame={f} scale={0.6} seed={63} />
          <Javelina x={810} y={2640} frame={f} scale={0.6} seed={64} alarmed />
          <HornedLizard x={960} y={2640} frame={f} scale={3} seed={65} />
          <Cap x={130} y={2640}>standing</Cap>
          <Cap x={370} y={2640}>running</Cap>
          <Cap x={620} y={2640}>collared peccary</Cap>
          <Cap x={810} y={2640}>alarmed, mane up</Cap>
          <Cap x={960} y={2640}>horned lizard, 3x</Cap>
        </Row>

        <Row ground={3120} title={2740} head="Turkey vulture, and the bat emergence"
          note="A dihedral V that teeters, with a tiny head, a long tail and fingered tips. The emergence is a ribbon of DENSITY and never individuals.">
          <TurkeyVulture x={200} y={2860} frame={f} scale={0.55} seed={41} />
          <TurkeyVulture x={460} y={2820} frame={f} scale={0.36} seed={42} />
          <TurkeyVulture x={330} y={2950} frame={f} scale={0.24} seed={43} />
          <BatColumn x={800} y={3120} frame={f} scale={0.5} seed={44} height={620} resolved={9} />
          <Cap x={310} y={3040}>turkey vultures, at three distances</Cap>
          <Cap x={840} y={3120}>free-tailed bat emergence</Cap>
        </Row>

        <GradeLayer f={f} vignette={0.06} grain={0.03} bloom={0.05} />
      </RegionLight>
    </svg>
  );
};
