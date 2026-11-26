# 캐릭터 NAI 프롬프트·시드

주인님이 직접 CG를 뽑으실 때 쓰는 참고표예요. 출처는 `tools/nai-log.json`(인물 외형), `tools/nai-style.json`(공통 설정), 그리고 주문서를 비우기 전의 `tools/nai-assets.json` 스탠딩 항목이에요(대부분 커밋 e27f226 직전, 츠바키·춘메이는 abaed34).

## 공통 설정(모든 그림)

- 모델 `nai-diffusion-5-full` · 샘플러 `k_euler_ancestral` · steps 28 · guidance(scale) 5 · quality tags 켬 · UC 프리셋 3
- 크기: 스탠딩 832×1216, CG·배경 1216×832, 정사각 1024×1024
- 스타일(프롬프트 끝에 붙음):
```
nsfw, 1.5::artist:tsunako::, 0.7::artist:mishima kurone, artist:toosaka asagi, artist:takeshima eku::, year 2026, 0.1::neptune (sereis)::, 0.1::date a live::, {best quality, very aesthetic, best details, highres, amazing quality, high complexity}, -6::artist collaboration::
```
- 네거티브(공통, 항목별 네거티브는 뒤에 덧붙음):
```
worst quality, bad quality, displeasing, very displeasing, lowres, bad anatomy, bad perspective, bad proportions, bad aspect ratio, bad face, long face, bad teeth, bad neck, long neck, bad arm, bad hands, bad ass, bad leg, bad feet, bad reflection, bad shadow, bad link, bad source, wrong hand, wrong feet, missing limb, missing eye, missing tooth, missing ear, missing finger, extra faces, extra eyes, extra eyebrows, extra mouth, extra tongue, extra teeth, extra ears, extra breasts, extra arms, extra hands, extra legs, extra digits, fewer digits, cropped head, cropped torso, cropped shoulders, cropped arms, cropped legs, mutation, deformed, disfigured, unfinished, chromatic aberration, text, error, jpeg artifacts, watermark, scan, scan artifacts
```

> 같은 시드라도 프롬프트·크기·모델·스타일 중 하나만 달라도 다른 그림이 나와요. 표정 차분은 대부분 기본 스탠딩을 `init`(img2img)으로 넣고 뽑아서, 시드만으로는 그대로 재현되지 않아요. 같은 얼굴을 원하시면 그 인물의 기본 스탠딩 그림을 이미지 참조(바이브/캐릭터 레퍼런스)로 함께 넣으시는 게 가장 확실해요.

## 인물별

### 오르페이아 (`orpheia`)

- 외형 태그: `1girl, white hair, very long hair, straight hair, green eyes`
- 대표 스탠딩 `st_orpheia_neutral` · **seed 161008233** (스탠딩 29장 중 29장이 이 시드)
```
1girl, solo, white hair, very long hair, straight hair, green eyes, maid headdress, green hair ribbon, maid, black dress, long sleeves, white apron, frilled apron, green bowtie, emerald brooch, black boots, standing, full body, looking at viewer, light smile, hands together
```

### 사연 (`sayeon`)

- 외형 태그: `1girl, black hair, very long hair, amber eyes`
- 대표 스탠딩 `st_sayeon_neutral` · **seed 5050505** (스탠딩 18장 중 18장이 이 시드)
```
1girl, solo, solo focus, black hair, very long hair, red hair ribbon, amber eyes, calm expression, hanbok, white jeogori, navy chima, holding calligraphy brush, holding scroll, standing, full body, looking at viewer, closed mouth
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate`

### 묵 (`muk`)

- 외형 태그: `1girl, black hair, long hair, grey eyes, pale skin`
- 대표 스탠딩 `st_muk_neutral` · **seed 6060606** (스탠딩 87장 중 81장이 이 시드)
- 다른 의상·차분에 쓴 시드: 8181818, 9191919
```
1girl, solo, solo focus, adult woman, black hair, long hair, hair dissolving into ink, dripping ink, grey eyes, pale skin, black and white hanbok-style dress, ink stains, floating ink droplets, standing, full body, looking at viewer, expressionless
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate`

### 윤슬 (`yunseul`)

- 외형 태그: `1girl, light brown hair, wavy hair, medium hair, light blue eyes`
- 대표 스탠딩 `st_yunseul_neutral` · **seed 7171717** (스탠딩 8장 중 8장이 이 시드)
```
1girl, solo, solo focus, young adult woman, 20 years old, singer, light brown wavy medium hair, light blue eyes, oversized pastel blue hoodie covered with history themed pin badges, black shorts, thigh high socks, sneakers, wireless earphones, holding a thick korean history book with sticky notes, standing, full body, looking at viewer, smile, closed mouth
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, watermark, signature, child`

### 누리 (`nuri`)

- 외형 태그: `1girl, child, black hair, short hair, messy hair, brown eyes, tan`
- 대표 스탠딩 `st_nuri_paleo` · **seed 8080808** (스탠딩 3장 중 3장이 이 시드)
```
1girl, solo, solo focus, child, young girl, black hair, messy short hair, brown eyes, tan skin, determined expression, standing, full body, looking at viewer, prehistoric, fur tunic covering body, long fur clothes, barefoot, holding a teardrop-shaped chipped stone in hand, stone tool
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, metal axe, hatchet, iron, blade, weapon, revealing clothes, navel`

### 노을 (`noeul`)

- 외형 태그: `1girl, tiger girl, orange hair, streaked hair, multicolored hair, very long hair, tiger ears, animal ear fluff, amber eyes, slit pupils, fang, pale skin`
- 대표 스탠딩 `st_noeul_smile` · **seed 7313131** (스탠딩 12장 중 9장이 이 시드)
- 이 그림은 `assets/st_noeul_surprised.webp`를 init으로 넣어 뽑음(strength 0.5)
```
1girl, solo, solo focus, adult woman, tiger spirit noble lady, very fair porcelain white skin, very long voluminous hair, bright orange hair, black streaks, multicolored hair, streaked hair, striped hair, orange hair with black tiger stripes, tiger ears, animal ear fluff, ears sticking out above the hair, amber eyes with slit pupils, small fang, luxurious ancient noble attire, layered white and crimson silk robe with gold embroidered tiger stripe trim, wide flowing sleeves, gold belt hung with green jade curved beads, gold hairpins, jade hair stick, small gold hair ornaments tucked behind the ears, jade earrings, small bronze mirror pendant, white fur stole with a gold clasp, silk shoes, elegant and haughty, standing, full body, looking at viewer, wide fanged grin, confident, hands on hips
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, nude, nipples, child, loli, watermark, signature, text, joseon hanbok, tan, dark skin, crown, tiara, large headdress, bear ears, round ears, solid orange hair, blonde hair, platinum blonde hair, white hair, light hair, mostly black hair`

### 나루 (`naru`)

- 외형 태그: `1girl, purple hair, long hair, single braid, hair over shoulder, yellow eyes, pale skin`
- 대표 스탠딩 `st_naru_smile` · **seed 6604417** (스탠딩 11장 중 8장이 이 시드)
- 다른 의상·차분에 쓴 시드: 7310731
```
1girl, solo, solo focus, adult woman, river spirit ferrywoman, long purple hair, thick single braid over the shoulder tied with a rope cord, small brass bell on the hair tie, pale gold eyes, fair skin, short indigo jeogori with white wave pattern on the hem, sleeves rolled up, loose white baji trousers rolled up to the knees, barefoot, knotted rope sash, straw sedge hat hanging on her back, holding a long wooden punting pole with carved tally marks, faint glowing water ripples around her ankles, standing, full body, looking at viewer, confident cheerful grin
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, nude, nipples, child, loli, watermark, signature, text`

### 울림 (`ullim`)

- 외형 태그: `1girl, green hair, gradient hair, colored tips, very long hair, floating hair, yellow eyes, pale skin`
- 대표 스탠딩 `st_ullim_smile` · **seed 7250725** (스탠딩 10장 중 10장이 이 시드)
```
1girl, solo, solo focus, adult woman, young adult, celestial maiden, feitian, apsara, very fair skin, very long flowing hair floating upward as if underwater, teal green hair, verdigris hair, gradient hair, gold hair tips, two-tone hair, gold eyes, dreamy gentle eyes, small gold forehead jewel, gold hair ornaments with dangling beads, long translucent pale jade celestial shawl swirling around her arms and body, hagoromo, floating scarf, gold beaded necklaces, jeweled ornaments, sheer pale jade silk top with gold trim, silk chest band, long flowing white and jade layered skirt, gold armlets, gold anklets, barefoot, holding a small ancient angular harp, konghou, floating slightly above the ground, full body, looking at viewer, gentle playful smile
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, nude, nipples, areola, child, loli, watermark, signature, text, wings, angel wings, feathered wings, halo, kimono, japanese clothes, black hair, brown hair, blonde hair, tan, dark skin`

### 달래 (`dallae`)

- 외형 태그: `1girl, black hair, hair bun, brown eyes`
- 대표 스탠딩 `st_dallae_smile` · **seed 9090909** (스탠딩 10장 중 7장이 이 시드)
- 다른 의상·차분에 쓴 시드: 2611241
```
1girl, solo, solo focus, adult woman, merchant, black hair, low bun, hairpin, brown eyes, ancient clothes, plain brown hemp robe, wide sleeves, cloth belt, no embroidery, rough fabric, cloth bundle on back, cheerful smile, standing, full body, looking at viewer
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, red skirt, embroidery, joseon hanbok, silk, luxurious`

### 해랑 (`haerang`)

- 외형 태그: `1girl, dark brown hair, short hair, side ponytail, green eyes`
- 대표 스탠딩 `st_haerang_smile` · **seed 6060606** (스탠딩 10장 중 7장이 이 시드)
- 이 그림은 `assets/st_haerang_shy.webp`를 init으로 넣어 뽑음(strength 0.6)
```
1girl, solo, solo focus, young adult woman, 21 years old, short dark brown hair, side ponytail, bright green eyes, ancient northeast asian clothes, dark blue wrap tunic with fur trim, leather belt, trousers, fur boots, small bow on back, standing, full body, looking at viewer, smile
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, joseon hanbok, armor, hanbok, child, loli, petite, flat chest`

### 아라 (`ara`)

- 외형 태그: `1girl, black hair, long hair, high ponytail, hazel eyes, tan, toned`
- 대표 스탠딩 `st_ara_smile` · **seed 2604040** (스탠딩 11장 중 8장이 이 시드)
- 다른 의상·차분에 쓴 시드: 2611245
```
1girl, solo, solo focus, young adult woman, 22 years old, goguryeo female archer, long black hair in a high ponytail tied with a red cord, two long pheasant feathers in her hair ornament, bright hazel eyes, sun-kissed skin, athletic toned build, short wrap jacket with red polka dot pattern and dark red trim at the collar and cuffs, leather belt, wide trousers tied at the ankles, leather boots, leather quiver of arrows on her back, holding a recurve bow, standing, full body, looking at viewer, bright smile, open mouth, one hand on her hip
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, joseon hanbok, child, loli, petite, flat chest, watermark, signature, text`

### 가온 (`gaon`)

- 외형 태그: `1girl, black hair, hair bun, brown eyes`
- 대표 스탠딩 `st_gaon_smile` · **seed 2604050** (스탠딩 11장 중 8장이 이 시드)
```
1girl, solo, solo focus, young adult woman, 21 years old, ancient silla court interpreter, black hair in a neat low bun with a simple silver hairpin, a few loose strands framing her face, soft brown eyes, long hip-length teal silk jacket with a narrow sash belt, long pleated white skirt, small brush tucked behind her ear, holding a bundle of bamboo slips tied with string, standing, full body, looking at viewer, bright smile, open mouth, one hand on her hip
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, joseon hanbok, child, loli, petite, flat chest, watermark, signature, text`

### 이랑 (`irang`)

- 외형 태그: `1girl, black hair, topknot, black eyes`
- 대표 스탠딩 `st_irang_smile` · **seed 2603301** (스탠딩 12장 중 12장이 이 시드)
```
1girl, solo, solo focus, adult woman, young adult, silla noble girl disguised as a young man, black hair tied up in a high topknot with a red hair band, a few loose strands, bright fierce dark eyes, slightly flat chest bound with cloth, silla hwarang youth outfit, white wrap jacket with red trim and a narrow belt, wide white trousers tied at the ankles, red sash, leather boots, wooden practice sword at her waist, standing, full body, looking at viewer, confident boyish grin
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, nude, nipples, child, loli, watermark, signature, text`

### 은실 (`eunsil`)

- 외형 태그: `1girl, black hair, very long hair, straight hair, brown eyes, tareme, pale skin`
- 대표 스탠딩 `st_eunsil_smile` · **seed 2603302** (스탠딩 12장 중 12장이 이 시드)
```
1girl, solo, solo focus, adult woman, young adult, gaya court musician maiden, very long straight black hair with a small gold hair ornament, gentle droopy brown eyes, pale skin, calm graceful, ancient gaya clothes, long cream wrap jacket with dark green trim and a cord belt, long pleated dark green skirt, jade comma bead necklace, holding a twelve string zither, standing, full body, looking at viewer, gentle soft smile
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, nude, nipples, child, loli, watermark, signature, text`

### 하늬 (`haneui`)

- 외형 태그: `1girl, black hair, long hair, hair bun, amber eyes`
- 대표 스탠딩 `st_haneui_smile` · **seed 2606060** (스탠딩 10장 중 7장이 이 시드)
```
1girl, solo, solo focus, young adult woman, 20 years old, unified silla noblewoman, jingol aristocrat lady, long glossy black hair in an elegant high updo with gold hairpins and a gold flower hair ornament, a few loose strands framing her face, warm amber eyes, gold drop earrings, deep purple silk long jacket with wide sleeves tied with a silk sash at the waist, long pleated pale lavender silk skirt, sheer silk shawl draped over her shoulders, small jade pendant, standing, full body, looking at viewer, bright confident smile, open mouth, one hand raised to her cheek
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, joseon hanbok, child, loli, petite, flat chest, watermark, signature, text`

### 사라 (`sara`)

- 외형 태그: `1girl, red hair, long hair, wavy hair, amber eyes, tan`
- 대표 스탠딩 `st_sara_smile` · **seed 2603303** (스탠딩 12장 중 12장이 이 시드)
```
1girl, solo, solo focus, adult woman, young adult, sogdian merchant's daughter, wavy long crimson red hair, tanned olive skin, golden amber eyes, exotic beauty, small gold earrings, central asian silk merchant clothes, red and gold patterned silk caftan with a sash, loose white trousers, embroidered slippers, necklace of silver coins, a small incense pouch, standing, full body, looking at viewer, bright cheerful smile
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, nude, nipples, child, loli, watermark, signature, text`

### 마루 (`maru`)

- 외형 태그: `1girl, black hair, long hair, braided bun, brown eyes`
- 대표 스탠딩 `st_maru_smile` · **seed 2607070** (스탠딩 10장 중 7장이 이 시드)
```
1girl, solo, solo focus, young adult woman, 22 years old, goryeo provincial noble family eldest daughter, long black hair in a low braided bun with a wooden hairpin, warm dark brown eyes, gentle but firm face, light beige jeogori jacket with burgundy collar and cuffs, long deep green pleated skirt, small apron tied at the waist, ring of iron keys hanging from her sash, standing, full body, looking at viewer, bright smile, open mouth, one hand on her hip
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, joseon hanbok, child, loli, petite, flat chest, watermark, signature, text`

### 서리 (`seori`)

- 외형 태그: `1girl, dark brown hair, medium hair, side braid, amber eyes, blush`
- 대표 스탠딩 `st_seori_smile` · **seed 2607080** (스탠딩 10장 중 7장이 이 시드)
- 이 그림은 `assets/st_seori_shy.webp`를 init으로 넣어 뽑음(strength 0.6)
```
1girl, solo, solo focus, young adult woman, 21 years old, goryeo northern frontier girl, shoulder-length dark brown hair with a short side braid, rosy cheeks, cheerful amber eyes, fur-trimmed brown hat, padded indigo winter jacket with fur collar, thick wrap trousers, leather boots, wool mittens hanging from a cord, standing, full body, looking at viewer, bright smile, open mouth, one hand on her hip
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, joseon hanbok, child, loli, petite, flat chest, watermark, signature, text`

### 여울 (`yeoul`)

- 외형 태그: `1girl, brown hair, wavy hair, low twintails, blue eyes, freckles`
- 대표 스탠딩 `st_yeoul_smile` · **seed 7070707** (스탠딩 10장 중 7장이 이 시드)
```
1girl, solo, solo focus, young adult woman, 21 years old, wavy chestnut brown hair, low twin tails tied with blue cloth, bright blue eyes, freckles, goryeo merchant girl, short jade green jacket with wide sleeves, long white skirt, cloth sash, small abacus hanging from belt, carrying a celadon vase, standing, full body, looking at viewer, big smile, open mouth
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, joseon hanbok, child, loli, petite, flat chest`

### 쇠별 (`soebyeol`)

- 외형 태그: `1girl, black hair, short hair, messy hair, black eyes, tan, toned`
- 대표 스탠딩 `st_soebyeol_smile` · **seed 2608090** (스탠딩 10장 중 7장이 이 시드)
- 다른 의상·차분에 쓴 시드: 2611246
```
1girl, solo, solo focus, young adult woman, 21 years old, goryeo blacksmith village girl, short messy black hair tied back with a cloth band, soot smudge on her cheek, bright determined black eyes, tanned skin, toned arms, sleeveless rough hemp work tunic over a short jacket tied at the waist, leather apron, wide hemp trousers, straw sandals, holding a blacksmith hammer, standing, full body, looking at viewer, bright smile, open mouth, one hand on her hip
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, joseon hanbok, child, loli, petite, flat chest, watermark, signature, text`

### 단비 (`danbi`)

- 외형 태그: `1girl, black hair, long hair, messy hair, black eyes, mole under eye`
- 대표 스탠딩 `st_danbi_smile` · **seed 2608100** (스탠딩 10장 중 7장이 이 시드)
```
1girl, solo, solo focus, young adult woman, 20 years old, goryeo commoner maiden, long black hair deliberately messy and tousled with a few strands sticking out, big lively dark eyes, small mole under one eye, plain pale pink jeogori with a short white collar, faded blue long skirt, cloth shoes, standing, full body, looking at viewer, bright smile, open mouth, one hand on her hip
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, joseon hanbok, child, loli, petite, flat chest, watermark, signature, text`

### 소담 (`sodam`)

- 외형 태그: `1girl, black hair, single braid, long hair, brown eyes`
- 대표 스탠딩 `st_sodam_smile` · **seed 8080808** (스탠딩 11장 중 8장이 이 시드)
```
1girl, solo, solo focus, young adult woman, 21 years old, black hair in a single long braid with red daenggi ribbon, round dark brown eyes, joseon palace maid, green jeogori jacket, long deep blue chima skirt, white apron, holding a small tray of yakgwa sweets, standing, full body, looking at viewer, cheerful smile
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, child, loli, petite, flat chest`

### 도담 (`dodam`)

- 외형 태그: `1girl, brown hair, single braid, hair over shoulder, hazel eyes`
- 대표 스탠딩 `st_dodam_smile` · **seed 1111201** (스탠딩 10장 중 7장이 이 시드)
```
1girl, solo, solo focus, young adult woman, 21 years old, joseon village doctor apprentice, chestnut brown hair in a single long braid over her shoulder tied with a red daenggi ribbon, a small herb sprig tucked behind her ear, bright hazel eyes, light pale green jeogori with sleeves rolled up to the elbows, deep indigo chima, white work apron tied at the waist, small leather pouch of acupuncture needles hanging from her waist, standing, full body, looking at viewer, bright energetic smile, open mouth, holding a bundle of dried herbs
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, child, loli, petite, flat chest, watermark, signature, text`

### 가람 (`garam`)

- 외형 태그: `1girl, dark brown hair, long hair, single braid, grey eyes, tan`
- 대표 스탠딩 `st_garam_smile` · **seed 2614141** (스탠딩 10장 중 7장이 이 시드)
```
1girl, solo, solo focus, adult woman, young adult, joseon mountain hunter girl, long dark brown hair in a single low braid tied with a red cloth, sharp grey eyes, slightly tanned skin, padded dark green jeogori with rolled-up sleeves, grey baji trousers, short fur vest, leather gaiters, straw sandals, gunpowder flask and small pouches at her waist, matchlock musket slung on her back, standing, full body, looking at viewer, small confident smile, calm
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, nude, nipples, child, loli, watermark, signature, text`

### 매향 (`maehyang`)

- 외형 태그: `1girl, mature female, tall, black hair, hair bun, black eyes`
- 대표 스탠딩 `st_maehyang_smile` · **seed 2323241** (스탠딩 10장 중 7장이 이 시드)
```
1girl, solo, solo focus, graceful mature adult woman, 27 years old, tall, glossy black hair in a neat formal joseon gisaeng updo with a large braided chignon, red plum blossom hair ornament and gold binyeo hairpin, dignified sharp dark eyes, joseon gisaeng, deep plum purple jeogori with gold trim and a long dark red otgoreum ribbon, long full navy chima skirt wrapped high under the bust, holding a folded paper with a poem, standing, full body, looking at viewer, calm dignified smile
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, child, loli, petite, flat chest, nude, nipples`

### 초련 (`choryeon`)

- 외형 태그: `1girl, black hair, hair bun, brown eyes, tsurime`
- 대표 스탠딩 `st_choryeon_smile` · **seed 2323242** (스탠딩 10장 중 7장이 이 시드)
```
1girl, solo, solo focus, proud young adult woman, 25 years old, glossy black hair in a joseon gisaeng updo with a few loose strands framing her face, pink lotus flower hair ornament, haughty upturned eyes, light brown eyes, joseon gisaeng, pale pink jeogori with white cuffs and a long magenta otgoreum ribbon, long full lilac chima skirt wrapped high under the bust, holding a geomungo plectrum, standing, full body, looking at viewer, smug smirk, chin up
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, child, loli, petite, flat chest, nude, nipples`

### 화선 (`hwaseon`)

- 외형 태그: `1girl, black hair, hair bun, amber eyes`
- 대표 스탠딩 `st_hwaseon_smile` · **seed 2323243** (스탠딩 10장 중 7장이 이 시드)
- 다른 의상·차분에 쓴 시드: 2611243
```
1girl, solo, solo focus, playful energetic young adult woman, 24 years old, glossy black hair in a joseon gisaeng updo decorated with many small colorful flower pins, bright mischievous amber eyes, joseon gisaeng, bright yellow jeogori embroidered with flowers and a long orange otgoreum ribbon, long full green chima skirt wrapped high under the bust, long dancing sleeves, standing on tiptoe, full body, looking at viewer, wide grin, wink, peace sign
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, child, loli, petite, flat chest, nude, nipples`

### 설아 (`seola`)

- 외형 태그: `1girl, black hair, hair bun, grey eyes, long eyelashes, pale skin, mole under eye`
- 대표 스탠딩 `st_seola_smile` · **seed 2323232** (스탠딩 11장 중 8장이 이 시드)
```
1girl, solo, solo focus, elegant young adult woman, 23 years old, glossy black hair in an elegant joseon gisaeng updo with a large braided chignon, white plum blossom hair ornament and silver binyeo hairpin, long eyelashes, calm dark grey eyes, fair snow-white skin, beauty mark under left eye, joseon gisaeng, short jade green jeogori with crimson cuffs and a long crimson otgoreum ribbon, long full deep rose chima skirt wrapped high under the bust, holding a folded white fan, standing, full body, looking at viewer, gentle mysterious smile, half-closed eyes
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, child, loli, petite, flat chest, nude, nipples`

### 초아 (`choa`)

- 외형 태그: `1girl, black hair, hair bun, black eyes, tsurime`
- 대표 스탠딩 `st_choa_smile` · **seed 2603304** (스탠딩 12장 중 12장이 이 시드)
```
1girl, solo, solo focus, adult woman, young adult, joseon female detective (damo), black hair in a tight low bun with a plain wooden hairpin, sharp narrow dark eyes, cool expression, dark indigo jeogori with tight sleeves, short black chima tied up over grey trousers for running, black cloth sash with a coiled red rope, an iron baton in her hand, straw sandals, standing, full body, looking at viewer, small cool smirk
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, nude, nipples, child, loli, watermark, signature, text`

### 단오 (`dano`)

- 외형 태그: `1girl, black hair, short hair, messy hair, brown eyes, tan`
- 대표 스탠딩 `st_dano_smile` · **seed 9090909** (스탠딩 9장 중 6장이 이 시드)
- 다른 의상·차분에 쓴 시드: 2611244
```
1girl, solo, solo focus, lively young adult woman, 21 years old, messy short black hair with a red ribbon headband, sparkling golden brown eyes, tanned skin, joseon commoner storyteller, faded yellow jeogori with rolled sleeves, short indigo chima over white trousers, straw sandals, holding a rolled hangul storybook and a folding fan, standing, full body, looking at viewer, grin, wink
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, child, loli, petite, flat chest`

### 바다 (`bada`)

- 외형 태그: `1girl, black hair, short hair, wavy hair, wet hair, black eyes, tan, toned`
- 대표 스탠딩 `st_bada_smile` · **seed 2603305** (스탠딩 12장 중 12장이 이 시드)
```
1girl, solo, solo focus, adult woman, young adult, jeju island haenyeo diver girl, short wavy black hair wet with seawater, sun-tanned skin, bright cheerful dark eyes, healthy athletic body, traditional white cotton haenyeo diving clothes (sleeveless top and shorts), a cloth headscarf, diving goggles on her forehead, an orange gourd float (tewak) with a net, iron abalone hook, standing, full body, looking at viewer, big cheerful smile
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, nude, nipples, child, loli, watermark, signature, text`

### 보리 (`bori`)

- 외형 태그: `1girl, black hair, single braid, brown eyes, tan`
- 대표 스탠딩 `st_bori_smile` · **seed 1313131** (스탠딩 10장 중 7장이 이 시드)
- 다른 의상·차분에 쓴 시드: 2611242
```
1girl, solo, solo focus, young young adult woman, 22 years old, farmer, sun-tanned skin, thick black hair in a low braid, white cotton headband, dark brown determined eyes, plain white hemp jeogori and white chima tucked up, white trousers, straw sandals, holding a bamboo spear, standing, full body, looking at viewer, warm smile
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, weapon pointing, armor, child, loli, petite, flat chest`

### 고요 (`goyo`)

- 외형 태그: `1girl, ghost, black hair, absurdly long hair, straight hair, black eyes, pale skin`
- 대표 스탠딩 `st_goyo_smile` · **seed 2603307** (스탠딩 12장 중 12장이 이 시드)
```
1girl, solo, solo focus, adult woman, young adult, korean virgin ghost (cheonyeo gwishin), extremely long straight black hair down to her ankles, pale white skin, sad gentle black eyes, faint blue glow, slightly transparent edges, plain white mourning hanbok (sobok), white jeogori and long white chima, barefoot, floating slightly above the ground, standing, full body, looking at viewer, shy faint smile
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, nude, nipples, child, loli, watermark, signature, text`

### 엘리 (`ellie`)

- 외형 태그: `1girl, blonde hair, long hair, wavy hair, half updo, blue eyes, freckles, pale skin`
- 대표 스탠딩 `st_ellie_smile` · **seed 2603306** (스탠딩 12장 중 12장이 이 시드)
```
1girl, solo, solo focus, adult woman, young adult, american missionary's daughter in 1900s korea, long wavy blonde hair half up with a navy ribbon, blue eyes, fair skin, freckles, 1900s western clothes, white high-collar blouse with puffed sleeves, long navy skirt, brown lace-up boots, holding a small korean geography book, standing, full body, looking at viewer, warm bright smile
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, nude, nipples, child, loli, watermark, signature, text`

### 한별 (`hanbyeol`)

- 외형 태그: `1girl, black hair, long hair, straight hair, parted bangs, single braid, black eyes`
- 대표 스탠딩 `st_hanbyeol_smile` · **seed 1414141** (스탠딩 11장 중 8장이 이 시드)
```
1girl, solo, solo focus, young adult woman, 21 years old, college student, long straight black hair with a neat center part and a long braid with a white ribbon, bright dark eyes, korean empire era 1900s mission school student, white jeogori with short sleeves, long black chima skirt, black leather shoes, holding a newspaper and books, standing, full body, looking at viewer, bright smile
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, sailor uniform, school uniform, modern, child, loli, petite, flat chest`

### 새벽 (`saebyeok`)

- 외형 태그: `1girl, black hair, short hair, bob cut, black eyes`
- 대표 스탠딩 `st_saebyeok_smile` · **seed 1515151** (스탠딩 17장 중 8장이 이 시드)
- 다른 의상·차분에 쓴 시드: 1515300, 1515158
```
1girl, solo, solo focus, young woman soldier, short bob black hair, sharp determined black eyes, 1940s korean liberation army uniform, olive drab military jacket with belt and shoulder straps, matching trousers, puttees, field cap with a small taegeuk badge, holding a rifle at her side, standing, full body, looking at viewer, hopeful smile
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, watermark, signature, japanese army, rising sun`

### 새벽 어머니 (`saebyeok_mom`)

- 외형 태그: `1girl, mature female, curvy, black hair, hair bun, black eyes`
- 대표 스탠딩 `st_saebyeok_mom_smile` · **seed 1515300** (스탠딩 8장 중 8장이 이 시드)
```
1girl, solo, solo focus, mature woman, adult korean woman in her late thirties, milf, beautiful, curvy, black hair in a loose low chignon with a few strands framing her face, sharp but gentle black eyes, 1980s korean woman, cream silk blouse with the top buttons undone, slight cleavage, long pleated navy skirt, beige cardigan over her shoulders, holding an old faded olive field cap with a small round taegeuk badge against her chest, standing, full body, looking at viewer, gentle mature smile
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, watermark, signature, japanese army, rising sun, child, loli, teenager, nude, nipples, old woman, wrinkles, grey hair`

### 봄내 (`bomnae`)

- 외형 태그: `1girl, black hair, short hair, bob cut, brown eyes, blush`
- 대표 스탠딩 `st_bomnae_smile` · **seed 2622220** (스탠딩 10장 중 5장이 이 시드)
- 다른 의상·차분에 쓴 시드: 2622230
```
1girl, solo, solo focus, young adult woman, 22 years old, 1970s korean garment factory worker, black hair in a short bob with a white cloth headband, round warm brown eyes, slightly flushed cheeks, light blue work blouse with sleeves rolled up, navy work skirt to below the knee, white factory apron with thread scraps, a thimble on her finger, canvas sneakers, standing, full body, looking at viewer, bright smile, open mouth, one hand on her hip
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, child, loli, petite, flat chest, watermark, signature, text`

### 다솜 (`dasom`)

- 외형 태그: `1girl, black hair, medium hair, straight hair, blunt bangs, black eyes`
- 대표 스탠딩 `st_dasom_smile` · **seed 1616161** (스탠딩 10장 중 4장이 이 시드)
- 다른 의상·차분에 쓴 시드: 1616168, 1616177
- 이 그림은 `assets/st_dasom_angry.webp`를 init으로 넣어 뽑음(strength 0.6)
```
1girl, solo, solo focus, 1980s korean college student, shoulder length straight black hair with bangs, kind dark eyes, white blouse under a navy cardigan, high-waisted light blue jeans, white sneakers, canvas shoulder bag, holding a stack of books and a white handkerchief, standing, full body, looking at viewer, gentle smile, black hair
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, watermark, signature, purple hair, blue hair, violet hair`

### 모아 (`moa`)

- 외형 태그: `1girl, gyaru, kogal, light brown hair, streaked hair, long hair, tan`
- 대표 스탠딩 `st_moa_smile` · **seed 2603308** (스탠딩 13장 중 13장이 이 시드)
```
1girl, solo, solo focus, adult woman, young adult, 1990s korean gyaru girl, bleached light brown long hair with highlights, tanned skin, bright playful eyes, heavy eyeliner, pink lip gloss, 1990s korean street fashion, cropped white tee, oversized baggy hip hop jeans, chunky sneakers, a pager clipped to her belt, plastic hair clips, hoop earrings, standing, full body, looking at viewer, cheeky grin, v sign
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, nude, nipples, child, loli, watermark, signature, text`

### 혜진 (`hyejin`)

- 외형 태그: `1girl, black hair, long hair, straight hair, high ponytail, amber eyes`
- 대표 스탠딩 `st_hyejin_neutral` · **seed 1818011** (스탠딩 6장 중 6장이 이 시드)
```
1girl, solo, solo focus, teenage girl, 18 years old, korean high school student, shaman girl, long straight black hair in a high ponytail tied with a red ribbon, sharp amber eyes, unique school uniform that fuses korean hanbok and a school uniform, white jeogori-style blouse with crossed collar and white dongjeong collar strip, long red goreum ribbon tied at the chest instead of a necktie, short navy uniform vest with brass buttons and a small bell crest emblem, long navy pleated chima-style skirt below the knees, black tights, loafers, school bag on her back with a cluster of small brass shaman bells on a red cord, five-colored cloth strips tied around her wrist, holding a folded fan, standing, full body, looking at viewer, calm expression, closed mouth
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel, watermark, signature, text, cleavage, revealing clothes, short skirt, miniskirt, panties, underwear, sexy, nsfw, mature female, large breasts`

### 상철 (`sangcheol`)

- 외형 태그: `1boy, faceless male, shaded face`
- 스탠딩 없음. 예시 CG `cg_sp_nt_noeul` · seed 2611301 (인물별 캐릭터 프롬프트):
```
boy, young man, black hoodie, hood pulled low, eyes hidden in hood shadow, faceless upper face, lying on his back, sleeping, tiger tail around his waist
```
- 인물 UC: `visible eyes`
- 다른 CG 시드: `cg_sp_nt_dallae` 2611302, `cg_sp_nt_irang` 2611303, `cg_sp_nt_eunsil` 2611304, `cg_sp_nt_naru` 2611305, `cg_sp_nt_ara` 2611306

### 츠바키 (`tsubaki`)

- 외형 태그: `1girl, black hair, hime cut, short hair, blunt bangs, dark brown eyes, pale skin`
- 대표 스탠딩 `st_tsubaki_smile` · **seed 2603309** (스탠딩 12장 모두 이 시드. smile·pregnant는 처음부터 뽑았고, 나머지 표정·집옷은 smile을 init으로 넣음)
```
1girl, solo, solo focus, adult woman, young adult, japanese girl from tsushima island in the early 17th century, black hime cut bob with straight bangs, a red camellia flower in her hair, dark brown eyes, pale skin, slender, korean hanbok borrowed and worn clumsily over a japanese kosode, patterned kosode collar showing at her neck, short light pink jeogori with a red goreum ribbon tied clumsily backwards, long deep indigo chima skirt, white tabi socks, straw zori sandals, small handmade vocabulary notebook tied at her waist with a cord, holding a small vocabulary notebook, standing, full body, looking at viewer, bright happy smile
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel`
- 집옷 `st_tsubaki_home` (init `assets/st_tsubaki_smile.webp`, strength 0.78):
```
1girl, solo, solo focus, adult woman, young adult, white cotton camisole and short pleated pajama shorts with a long beige knit cardigan slipping off one shoulder, a red camellia hair clip, barefoot, relaxed at home, simple background, no props, standing, full body, looking at viewer, gentle smile
```

### 춘메이 (`chunmei`)

- 외형 태그: `1girl, black hair, double bun, brown eyes, flour on cheek`
- 대표 스탠딩 `st_chunmei_smile` · **seed 2603310** (스탠딩 12장 모두 이 시드. smile·pregnant는 처음부터 뽑았고, 나머지 표정·집옷은 smile을 init으로 넣음)
```
1girl, solo, solo focus, adult woman, young adult, 1920s shanghai chinese girl, black hair in double buns, bright brown eyes, lively, red cheongsam (qipao) with mandarin collar and frog buttons, sleeves rolled up, white flour-dusted apron, wooden abacus hanging at her waist, black cloth shoes, a little flour on her cheek, holding an abacus, standing, full body, looking at viewer, bright happy smile
```
- 추가 네거티브: `multiple views, reference sheet, character sheet, multiple girls, 2girls, clone, duplicate, border, frame, panel`
- 집옷 `st_chunmei_home` (init `assets/st_chunmei_smile.webp`, strength 0.78):
```
1girl, solo, solo focus, adult woman, young adult, red satin pajama shirt with chinese frog buttons, unbuttoned at the collar, and short black satin pajama shorts, hair down from the buns, barefoot, relaxed at home, simple background, no props, standing, full body, looking at viewer, gentle smile
```
