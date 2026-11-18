# Suno 프롬프트 ① — BGM (가사 없음)

> 만든 파일은 `assets/bgm/<파일명>.mp3`로 넣으면 바로 재생된다(파일이 없으면 조용히 건너뜀).
> 모든 곡 공통: Suno에서 **Instrumental** 켜기, 2~3분, 처음과 끝이 자연스럽게 이어지는 루프형.
> 장면 → 곡 연결은 `bgm.js`가 배경 이름으로 자동으로 고른다(아래 '쓰이는 곳').

공통 꼬리표(모든 스타일 끝에 붙이면 톤이 맞는다):
`seamless loop, no vocals, game soundtrack, warm analog mix`

---

## bgm_title — 타이틀
- 쓰이는 곳: 타이틀 화면
- Style:
```
Japanese indie pop-rock instrumental, sparkling clean guitar arpeggios, gentle piano motif, melodic bass, soft brushed drums, nostalgic summer night, hopeful and wistful, slowly blooming arrangement, main theme of a visual novel about history and music, seamless loop, no vocals
```

## bgm_daily — 작업실 낮 · 남매 일상
- 쓰이는 곳: 지정 없는 일상 장면 기본값
- Style:
```
lo-fi city pop instrumental, light funky clean guitar, rhodes electric piano, bouncy bass, relaxed drum groove, comedic slice of life, sibling banter in a cozy home studio, playful and warm, seamless loop, no vocals
```

## bgm_night_shift — 새벽 세 시의 작업실
- 쓰이는 곳: `cg_studio_night` (모든 장의 도입·가사 검수)
- Style:
```
chill lo-fi hip hop instrumental, mellow piano chords, vinyl crackle, soft synth pads, slow head-nod beat, glowing monitors at 3 a.m., quiet concentration with a faint smile, cup noodles and headphones, seamless loop, no vocals
```

## bgm_outing — 연표 다이브 · 시대 탐방
- 쓰이는 곳: 모든 `bg_era_*` 배경(시대 장면 기본값)
- Style:
```
cinematic folk adventure instrumental, korean gayageum and daegeum melodies over acoustic guitar and light strings, gentle hand percussion, sense of wonder walking through ancient landscapes, curious and bright, documentary travel mood, seamless loop, no vocals
```

## bgm_orpheia — 오르페이아 테마
- 쓰이는 곳: 다이브 통로, 오르페이아 CG, 마음이 움직이는 장면
- Style:
```
gentle music box and celesta melody, soft strings and harp, warm piano, tender and devoted, a virtual maid's affection, slightly magical digital sparkle, lullaby-like 3/4 waltz feel, seamless loop, no vocals
```

## bgm_exam — 기출 풀기
- 쓰이는 곳: 문제 화면(퀴즈가 열리면 자동)
- Style:
```
focused minimal electronic instrumental, ticking clock percussion, pulsing synth arpeggio, light piano stabs, steady 100 bpm, calm tension of a test, clean and unobtrusive under reading, seamless loop, no vocals
```

## bgm_result — 발매 정산 · 상태창
- 쓰이는 곳: 발매 HUD, MV 노래 파일이 아직 없을 때의 대체 곡
- Style:
```
upbeat celebratory J-pop instrumental, bright brass hits, sparkling synth, clapping groove, level up fanfare feeling, subscriber count going up, short triumphant phrases, seamless loop, no vocals
```

## bgm_challenge — 먹물(묵)과의 악플 배틀
- 쓰이는 곳: `cg_ink_spread`, `cg_comment_flame`
- Style:
```
dark tense rock instrumental, distorted guitar riff, ink-drip glitch sound design, ominous low strings, driving toms, a mysterious troll spreading false history, mischievous and lonely undertone, battle against doubt, seamless loop, no vocals
```

## bgm_comedy — 러브코미디 사건
- 쓰이는 곳: 히로인 사건 CG(`cg_chNN_*`, `cg_yeoul_*`) — 넘어짐·책임져·질투 장면
- Style:
```
slapstick romantic comedy anime instrumental, pizzicato strings, bouncy bassoon and clarinet, xylophone accents, comedic timing stingers, flustered blushing chaos, jealous maid energy, light and silly, seamless loop, no vocals
```

## bgm_romance — 설렘 · 둘만의 밤
- 쓰이는 곳: 가마 앞의 밤, 등 맞대고 옷 말리기, 극장 손잡기, 작별
- Style:
```
tender romantic instrumental, soft acoustic guitar fingerpicking, warm cello, gentle piano, fireflies and campfire glow, quiet heartbeat, bittersweet first love across time, slow and intimate, seamless loop, no vocals
```

## bgm_tragic — 비극의 현장
- 쓰이는 곳: 우금치, 제주 4·3, 광주 1980, 흥남, 삼전도, 불탄 궁궐 등(개그를 끊는 장면)
- Style:
```
solemn requiem instrumental, slow piano and haegeum, low strings, sparse and respectful, grief without melodrama, remembering nameless people, cold wind ambience, very restrained, seamless loop, no vocals
```

## bgm_yunseul — 윤슬 테마 (역사덕후 폭주)
- 쓰이는 곳: 윤슬이 덕질하는 CG, 남매 개그
- Style:
```
hyperactive bubblegum pop instrumental, fast synth bass, sparkling chiptune accents, handclaps, energetic 170 bpm, an excited little sister binge-watching history videos at 3 a.m., chaotic and adorable, seamless loop, no vocals
```

## bgm_ending — 앨범 발매 · 전원 집합 엔딩
- 쓰이는 곳: `cg_ep_release`, `cg_ep_all`
- Style:
```
grand emotional finale instrumental, full band with sparkling guitars, soaring strings, choir pads, the main title melody returning in a brighter key, celebration and gratitude, every character gathered, tears and laughter, ends on a warm sustained chord, no vocals
```
