# Pantheons — shipped and backlog

Each pantheon is a data file: a roster and an edge list. No engine work is involved, because
relations resolve only within a pantheon and the resolver is already pantheon-agnostic.

The thing that makes a pantheon worth adding is **not** how famous its gods are. It is the density
and legibility of its *family violence*. A pantheon of powerful but unrelated figures adds nothing —
it plays exactly like a stat sheet.

## Shipped

| Pantheon | Units | Defining shape |
|---|---|---|
| **Greek** | 22 | **Filicide.** A Titan who ate his own children, and the son who cut the others free. Uniquely carries the `devourer` trait. |
| **Norse** | 22 | **Mutual destruction.** Thor and Jörmungandr kill each other; so do Heimdall and Loki. Several pairs carry `slain_by` in both directions. |
| **Egyptian** | 22 | **Fratricide and generational revenge.** Set murders his brother, Isis restores him, their son spends eighty years contending for the throne. The densest single family cluster in the game. |

`devourer` remains unique to Cronus. Norse and Egyptian parents hesitate against their children
normally, which is a real difference in how the three play, and is asserted by test.

---

## Backlog, ranked

### 1. Egyptian — ✅ shipped
Kept here for the reasoning: the Osiris cycle is the tightest revenge drama in world myth, entirely
self-contained, widely familiar, and carries no living-tradition sensitivity.

### 2. Arthurian
**The version of "superheroes" that actually works.** Same heroic register, but with a real
genealogy instead of invented narrative ties, and entirely public domain.

- Arthur and Mordred are father and son **and** kill each other — a mutual `slain_by` on top of `parent`
- Morgan le Fay is Arthur's half-sister *and* Mordred's mother
- Lancelot / Guinevere / Arthur is precisely the triangle the Jealousy mechanic was built for
- Gawain, Gareth and Gaheris are brothers; Lancelot kills the younger two by accident and Gawain's
  vengeance destroys the Round Table

Defining shape: **loyalty collapsing into betrayal.** Everyone starts allied.

### 3. Celtic / Irish
Underused and startlingly brutal.

- Cú Chulainn kills his own foster-brother Ferdiad in single combat over three days
- He also kills his own son, Connla, not recognising him
- The Morrígan offers herself to him, is refused, and turns on him for it
- Lugh is his father; Balor is Lugh's grandfather, killed by him

Defining shape: **the hero destroying his own bloodline, mostly by accident.**

### 4. Japanese / Shinto
Contains one of the single best edges available anywhere:

- Izanagi and Izanami are spouses who become mortal enemies after her death — he flees the
  underworld, she vows to kill a thousand people a day, he vows to create fifteen hundred
- Amaterasu and Susanoo are siblings whose quarrel hides the sun
- Tsukuyomi kills a food goddess and Amaterasu never speaks to him again, which is why sun and moon
  are never in the sky together

**Caveat:** Shinto is a living tradition. See the note below.

### 5. Hindu
**The richest relational material of any option, by a distance** — and the one with the most care
required.

- The Mahābhārata is *explicitly* about kin fighting kin. Karna and Arjuna are half-brothers who do
  not know it and kill each other.
- The Bhagavad Gītā opens with Arjuna laying down his bow because he cannot bring himself to fight
  his own relatives. **That is the Reluctance mechanic, stated as scripture.**
- Shiva beheads Ganesha and replaces the head with an elephant's — a parent/child edge with no
  equivalent anywhere else
- The Pandava brothers are each fathered by a different god; Draupadi is married to all five

**Caveat:** Hinduism is a living religion practised by roughly a billion people, not a dead
mythology. Putting its deities into a combat game invites offence in a way Greek and Norse simply do
not. This is not a reason never to do it — but it is a reason to do it deliberately, with respect in
the framing and lore, rather than dropping it in as content #5.

### 6. Mesopotamian
Strong material, lower recognition.

- Marduk kills Tiamat, his own ancestor, and builds the world from her body
- Gilgamesh and Enkidu are made brothers, and Enkidu's death is the engine of the whole epic
- Ishtar propositions Gilgamesh, is refused, and sends the Bull of Heaven in retaliation

### 7. Aztec
Quetzalcóatl and Tezcatlipoca as eternal antagonists who repeatedly destroy each other's worlds is
excellent. Huitzilopochtli is born fully armed and immediately kills his sister and four hundred
brothers — which is a spectacular single-figure massacre edge. Lower familiarity, and the material
is genuinely grim.

---

## Explicitly rejected

### Roman — do not add
Jupiter *is* Zeus. Juno *is* Hera. Mars *is* Ares. The Romans syncretised the Greek pantheon
wholesale, so the genealogy is **identical** and only the names differ.

For this game specifically that is the worst possible addition: the entire strategic axis is
"a different pantheon means no relations between us," but Greek and Roman are *the same relations
with different labels*. You would ship two isomorphic graphs, gain no new play, and confuse every
player who knows the myths.

There is genuinely Roman material — Janus, Quirinus, Bellona, the Lares, Romulus and Remus — but it
is thin, and not enough to carry a roster.

### Licensed superheroes — do not add
Two reasons, either sufficient:

1. **Legal.** Marvel and DC characters are aggressively defended IP. Public-domain mythology is this
   design's entire economic advantage: the relationship graph is *research, not invention*. Trading
   that for content you cannot ship is a bad deal.
2. **Mechanical.** The engine runs on genealogy. Superhero relationships are overwhelmingly
   narrative — mentor, nemesis, teammate — not familial. The graph would be sparse, and you would be
   inventing edges rather than looking them up. The exceptions that do work (Thor/Loki/Odin) are
   simply Norse.

Use **Arthurian** instead. It scratches the same itch with a real family tree and no lawyers.

---

## A note on living traditions

Greek, Norse, Egyptian, Mesopotamian, Aztec and Arthurian are all dead or literary traditions, and
carry effectively no risk of giving offence.

Hindu, Shinto and (in parts) Celtic neopaganism are living practice. Adding them is not off the
table — plenty of games do — but it should be a deliberate decision with the framing and lore written
carefully, rather than an accident of working down a backlog.
