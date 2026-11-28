#!/usr/bin/env python3
"""story/*.js 의 `// [NAI_NSFW_CG: id] 설명` 마커 전체에서 NAI V5 Medium Effort 주문(tools/nai-assets.json 항목)을 생성한다.

개선 사항:
1. 시대 배경 및 장소 불일치 해결:
   - 단순 부분 문자열("눈"→"눈물", "비"→"비단", "강"→"강하게", "배 위"→복부 등) 매칭을 제거하고,
     각 장면의 정확한 시대·공간·소품 태그(SCENE_OVERRIDES 및 @bg 기반 시대 매핑)를 명시한다.
   - 전근대 배경(고대~개항기) 장면에는 modern bedroom, western bed, mattress, glass window 등의
     네거티브 프롬프트(PREMODERN_NEG)를 추가해 현대식 침실/욕실 오생성을 차단한다.
2. 본문 서술과 체위(Pose)·상황 완벽 일치:
   - 각 CG ID별로 본문 지문과 마커 설명에 기술된 정확한 체위, 반착의/탈의 상태, 결박/수유/소품 연출을 1:1 매핑한다.
3. 캐릭터 프로필 및 tools/nai-rules.json 규칙 준수:
   - tools/nai-rules.json의 character_breast_map(5단계 가슴 크기), loli_characters(설아·울림·단비 전용),
     tag_replacements, forbidden_patterns를 엄격히 적용하여 node tools/lint.js 검사를 통과한다.
   - tools/nai-log.json의 캐릭터별 고유 외형(머리색, 눈동자 색, 헤어스타일)과 시대별 의상·고유 소품을 유지한다.
4. NAI V5 Medium Effort(nai-diffusion-5-full-medium) 설정으로 Anlas 사용량을 절약한다.
"""
import json, re, glob, zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODEL = "nai-diffusion-5-full-medium"
LOOKS = json.loads((ROOT / "tools/nai-log.json").read_text(encoding="utf-8"))
RULES = json.loads((ROOT / "tools/nai-rules.json").read_text(encoding="utf-8"))
BMAP = RULES.get("character_breast_map", {})
LOLI_SET = set(RULES.get("loli_characters", []))

PREMODERN_NEG = (
    "modern bedroom, western bed, mattress, modern pillow, modern furniture, "
    "modern bathroom, shampoo bottle, tile wall, glass window, electric lamp, modern clothes, smartphone, laptop"
)

# 가슴 구간별 반대 체형 억제용 네거티브 가중치 블록 (tools/nai-assets.json 표준 컨벤션)
TIER_NEG_WEIGHT = {
    "flat chest": "-3::mature female, huge breasts, large breasts, medium breasts, curvy, tall female::",
    "small breasts": "-3::mature female, huge breasts, large breasts, medium breasts::",
    "medium breasts": "-3::huge breasts, flat chest::",
    "large breasts": "-3::flat chest, small breasts::",
    "huge breasts": "-3::flat chest, small breasts::",
}

# 묵·사연 배틀 및 종장 탈의 CG 34종 개별 설정 (시대별 복식·소품 보존)
MUK_SAYEON_SCENES = {
    "cg_muk_goryeo_d1": {
        "env": "indoors, goryeo dynasty wooden room, winter",
        "muk_cloth": "torn goryeo noble purple and crimson silk hanbok jacket and skirt, ink stains, exposed cleavage and bare shoulders, exposed thighs, lonely and embarrassed expression",
    },
    "cg_muk_goryeo_d3": {
        "env": "indoors, goryeo dynasty wooden room, winter",
        "muk_cloth": "completely torn goryeo silk hanbok shreds, almost nude, thin silk ribbon barely covering nipples and crotch, sitting on ground covering blushing cheeks",
    },
    "cg_muk_general_d1": {
        "env": "goryeo palace courtyard at night, torches",
        "muk_cloth": "shattered goryeo general heavy lamellar armor plates falling apart, torn inner white tunic, exposed cleavage, toned stomach and thighs, wistful smile",
    },
    "cg_muk_general_d3": {
        "env": "goryeo palace courtyard at night, torches",
        "muk_cloth": "completely destroyed goryeo armor, broken shoulder guard and thin armor cords barely covering pink nipples and groin, almost nude, sitting on ground blushing",
    },
    "cg_muk_yeogwan_d1": {
        "env": "indoors, joseon palace hall, paper lantern light",
        "muk_cloth": "torn joseon court lady green dangui jacket and navy chima skirt, ripped white inner jeogori, exposed cleavage and thighs, calm breathing",
    },
    "cg_muk_yeogwan_d3": {
        "env": "indoors, joseon palace hall at night",
        "muk_cloth": "shredded joseon court lady green dangui and skirt, almost nude, palace hair ornament and a single silk goreum ribbon barely covering nipples and groin, sitting on floor embarrassed",
    },
    "cg_muk_lotus_d1": {
        "env": "outdoors, night river shore with glowing lotus lanterns",
        "muk_cloth": "torn lotus-petal shaped pink and white hanbok bursting like flower petals, scattering lotus petals, exposed cleavage and pale thighs, serene smile",
    },
    "cg_muk_lotus_d3": {
        "env": "outdoors, night river shore with glowing lotus lanterns",
        "muk_cloth": "completely torn lotus hanbok, only two or three pink lotus petals barely covering nipples and crotch, nude, sitting on ground blushing",
        "sayeon_cloth": "torn joseon female archer scroll outfit, loosened robe revealing bare shoulder, deep cleavage and thighs, holding bow, breathing hard",
    },
    "cg_muk_rain_d1": {
        "env": "outdoors, rainy joseon village night, rain, wet",
        "muk_cloth": "wet translucent indigo raindrop-patterned hanbok torn apart, water droplets on skin, exposed cleavage and thighs, gentle smile",
    },
    "cg_muk_rain_d3": {
        "env": "outdoors, rainy joseon village night, rain, wet",
        "muk_cloth": "completely shredded wet indigo hanbok, water droplets and wet silk scraps barely covering nipples and groin, bound by paper scroll ropes, sitting on ground",
        "sayeon_cloth": "torn joseon damo detective indigo jacket and vest, unfastened chest revealing deep cleavage and thighs, holding paper scroll rope, breathing hard",
    },
    "cg_muk_talchum_d1": {
        "env": "outdoors, joseon market mask dance stage, lantern light",
        "muk_cloth": "torn colorful saekdong striped long dancing sleeves and talchum performer vest, wooden traditional mask tilted on head, exposed cleavage and thighs, smiling",
    },
    "cg_muk_talchum_d3": {
        "env": "outdoors, joseon market mask dance stage, lantern light",
        "muk_cloth": "shredded talchum performer costume, colorful saekdong cloth scraps and broken sash barely covering nipples and groin, wooden mask on head, sitting on ground",
        "sayeon_cloth": "joseon gayageum musician silk jeogori with untied goreum ribbon, slipping off shoulders, exposed deep cleavage and bare shoulders, holding gayageum zither",
    },
    "cg_muk_donghak_d1": {
        "env": "outdoors, late joseon winter field, torchlight",
        "muk_cloth": "torn white cotton donghak peasant jeogori and headband, sweat on skin, exposed cleavage and thighs, peaceful smile",
    },
    "cg_muk_donghak_d3": {
        "env": "outdoors, late joseon winter field, torchlight",
        "muk_cloth": "completely torn white cotton peasant clothes, white headband and cloth scraps barely covering nipples and crotch, sitting on ground blushing",
        "sayeon_cloth": "1890s western bustle dress woven from paper scrolls with unlaced corset ribbons, exposed deep cleavage and bare shoulders, breathing hard",
    },
    "cg_muk_modern1900_d1": {
        "env": "1900s jeongdong brick street, gaslight",
        "muk_cloth": "torn 1900s korean female student magenta jeogori and skirt, holding parasol, torn white inner shirt, exposed cleavage and thighs, blushing smile",
    },
    "cg_muk_modern1900_d3": {
        "env": "1900s jeongdong brick street, gaslight",
        "muk_cloth": "completely shredded 1900s student hanbok, broken parasol ribbon and fabric scraps barely covering pink nipples and groin, sitting on ground",
        "sayeon_cloth": "1900s ewha school white jeogori with untied goreum and torn collar, exposed deep cleavage and bare shoulders, holding scroll, blushing",
    },
    "cg_muk_uibyeong_d1": {
        "env": "1900s brick corridor, dim light",
        "muk_cloth": "torn korean righteous army traditional overcoat (durumagi) and jacket, leather bandolier strap crossing between exposed breasts, bare stomach and thighs, embarrassed",
    },
    "cg_muk_uibyeong_d3": {
        "env": "1900s brick corridor, dim light",
        "muk_cloth": "shredded righteous army uniform, broken leather bandolier strap and paper telegraph tape strips barely covering nipples and groin, sitting on ground",
        "sayeon_cloth": "1900s telegraph operator white blouse with popped buttons, exposed deep cleavage and bare shoulder, paper tape ribbons around waist",
    },
    "cg_muk_manse_d1": {
        "env": "1919 street, daylight",
        "muk_cloth": "torn 1919 march first student white jeogori and black skirt, holding small taegeukgi flag partially covering exposed cleavage and pale thighs, gentle smile",
    },
    "cg_muk_manse_d3": {
        "env": "1919 street, daylight",
        "muk_cloth": "completely torn white jeogori and black skirt, small taegeukgi cloth scrap and hair ribbon barely covering pink nipples and groin, sitting on ground",
        "sayeon_cloth": "1920s shanghai secretary western blouse with undone buttons and torn skirt, exposed deep cleavage and bare thighs, breathing hard",
    },
    "cg_muk_moga_d1": {
        "env": "1920s gyeongseong street, vintage streetlamp",
        "muk_cloth": "torn 1920s modern girl western flapper dress and cloche hat, exposed lace bra, garter belt stockings, exposed cleavage and thighs, smiling",
    },
    "cg_muk_moga_d3": {
        "env": "1920s gyeongseong street, vintage streetlamp",
        "muk_cloth": "completely shredded 1920s modern girl dress, tilted cloche hat ribbon and snapped garter belt straps barely covering nipples and groin, sitting on ground",
        "sayeon_cloth": "1920s female reporter trench coat and unbuttoned blouse pulled open, exposed deep cleavage and thighs, blushing",
    },
    "cg_muk_hangul_d1": {
        "env": "1930s study room with scattered manuscript pages",
        "muk_cloth": "torn scholar-style hanbok with hangul letter patterns, floating word cards around her, exposed cleavage and thighs, gentle smile",
    },
    "cg_muk_hangul_d3": {
        "env": "1930s recording room with vintage standing microphone",
        "muk_cloth": "completely torn hangul-patterned hanbok, two or three paper word cards and daenggi ribbon barely covering pink nipples and groin, sitting on ground",
        "sayeon_cloth": "1930s vintage singer evening dress with snapped shoulder strap slipping down, exposed deep cleavage and high-slit bare thighs, standing by vintage microphone",
    },
    "cg_muk_liberation_d1": {
        "env": "1945 liberation street, sunlight",
        "muk_cloth": "torn 1940s korean liberation army olive uniform jacket and shirt, field cap, taegeuk armband and leather suspender straps over exposed cleavage and thighs, smiling",
    },
    "cg_muk_liberation_d3": {
        "env": "1945 radio broadcast booth with vintage microphone",
        "muk_cloth": "completely shredded liberation army uniform, tilted field cap, broken leather belt and taegeuk armband scraps barely covering nipples and groin, sitting on ground",
        "sayeon_cloth": "1945 radio announcer formal suit jacket and torn white blouse open at chest, exposed deep cleavage and thighs, standing by broadcast microphone",
    },
    "cg_muk_refugee_d1": {
        "env": "1950s wartime street",
        "muk_cloth": "torn 1950s teacher-style modest blouse and black skirt, ripped white undershirt, exposed cleavage and thighs, wistful smile",
    },
    "cg_muk_refugee_d3": {
        "env": "1950s field hospital tent",
        "muk_cloth": "completely torn 1950s blouse and skirt, white first-aid bandage strips wrapped scantily across pink nipples and groin, sitting on ground blushing",
        "sayeon_cloth": "1950s nursing officer uniform jacket with popped buttons, exposed deep cleavage and thighs, holding medical bandage roll, breathing hard",
    },
    "cg_muk_handkerchief_d1": {
        "env": "1980s university campus plaza",
        "muk_cloth": "torn 1980s college student plaid shirt and jeans, white handkerchief tied around neck hanging over exposed cleavage, bare midriff and thighs, smiling",
    },
    "cg_muk_handkerchief_d3": {
        "env": "1980s university campus plaza, acoustic guitar nearby",
        "muk_cloth": "completely shredded plaid shirt and jeans, white handkerchief from neck and torn belt strap barely covering pink nipples and groin, sitting on ground",
        "sayeon_cloth": "1980s denim jacket over torn white t-shirt revealing deep cleavage and bare thighs, holding acoustic guitar, breathing hard",
    },
    "cg_muk_idol_d1": {
        "env": "modern k-pop stage lights",
        "muk_cloth": "torn k-pop idol stage crop top and pleated miniskirt, sparkling sequin underwear, exposed cleavage, navel and thighs, smiling",
    },
    "cg_muk_idol_d3": {
        "env": "modern broadcast studio",
        "muk_cloth": "completely shredded idol stage costume, choker ribbon, snapped microphone cord and sequin scraps barely covering pink nipples and groin, sitting on floor",
        "sayeon_cloth": "modern news anchor tailored suit jacket with torn unbuttoned blouse revealing deep cleavage and thighs, blushing, breathing hard",
    },
    "cg_ep_sayeon_scroll_break": {
        "env": "glowing timeline pathway in abstract starry void, floating paper scrolls",
        "sayeon_only": "nude, robe of long paper scrolls unraveling and flying away into the air, a single thin paper scroll strip barely draping across nipples and lower belly, covering blushing face with calligraphy brush, thighs pressed together in embarrassment",
    },
    "cg_ep_muk_pages_break": {
        "env": "glowing timeline pathway turning into warm white light, scattering paper pages and ink droplets",
        "muk_only": "nude, torn exam paper pages and black ink dress scattering into glowing light particles, crouching, pale skin, last ink marks on chest and groin dissolving into white light, serene and emotional expression",
    },
}

# 히로인 + 상철 H씬 CG 160종 개별 정밀 매핑
# (체위/상황/장소/복장·소품/전근대 여부)
SCENE_OVERRIDES = {
    # ── Chapter 02 (고조선·부여·삼한) ──
    "cg_ch02_noeul_h1": {
        "premodern": True,
        "env": "inside dark wooden watchtower of ancient gojoseon fortress wall, dusk shadows, fur pelt on wooden floor",
        "pose": "face-to-face, sitting on lap, straddling, girl on top, vaginal, deep kiss, french kiss",
        "girl": "partially undressed, tiger-stripe patterned silk robe pulled open off shoulders, exposed huge breasts, pink nipples, gold hairclips, jade earrings, tiger ears, fluffy striped tiger tail wrapped tightly around his waist, straddling his lap, arms around his neck, kissing with tongue",
        "boy": "sitting against wooden wall, holding her hips, kissing back",
    },
    "cg_ch02_dallae_h1": {
        "premodern": True,
        "env": "outdoors, snowy corner near ancient buyeo winter festival bonfire at night, snow on ground, wrapped together inside a large fox fur pelt",
        "pose": "foreplay, mutual masturbation, fondling, hugging under fur pelt, no penetration",
        "girl": "clothed, brown hemp robe front pulled open, exposed medium breasts, nipples, wooden hairclip, guiding his hand onto her bare breast and between her thighs under skirt, deep blush, warm breath",
        "boy": "sitting close beside her under the fox fur pelt, one hand fondling her breast, other hand under her skirt between her thighs",
    },
    "cg_ch02_dallae_h2": {
        "premodern": True,
        "env": "inside ancient sodo forest merchant tent, oil lamp light, piles of merchant cloth bundles and wooden tally ledger",
        "pose": "paizuri, breasts squeezed together around penis, vaginal missionary preparation, legs spread",
        "girl": "partially undressed, brown hemp jeogori and inner shirt pulled open, skirt pushed up, wooden hairclip, leaning back against cloth bundles, squeezing her medium breasts together around his penis, saliva on cleavage, spreading thighs",
        "boy": "kneeling between her spread legs, thrusting between her breasts",
    },
    # ── Chapter 03 (삼국·가야) ──
    "cg_ch03_eunsil_h1": {
        "premodern": True,
        "env": "outdoors, night on grassy hill near ancient gaya burial mounds, moonlight, twelve-string gayageum zither lying on grass beside them, discarded clothes",
        "pose": "missionary, vaginal, lying on back, legs spread",
        "girl": "nude, small gold hair ornament, jade comma bead necklace, lying on back on grass field, slender legs spread, teary eyes, blushing, soft moaning",
        "boy": "on top of her between her legs, holding her hand",
    },
    "cg_ch03_naru_h1": {
        "premodern": True,
        "env": "on wooden ferry boat floating on misty han river at dawn, water mist, wooden boat floor, punting pole",
        "pose": "missionary on boat floor, legs spread, vaginal, after footjob, wet feet",
        "girl": "partially undressed, indigo jeogori removed, exposed large breasts, nipples, small brass bell on hair tie, white trousers rolled up and pulled down, barefoot with faint blue water glow on ankles, lying back on wooden boat planks, legs wrapped around his waist",
        "boy": "on top of her on the wooden ferry boat, holding her thighs",
    },
    "cg_ch03_irang_h1": {
        "premodern": True,
        "env": "outdoors, behind large riverside rock under moonlight at night, stream water reflection",
        "pose": "face-to-face, sitting on lap, straddling, cowgirl position, vaginal, passionate kiss",
        "girl": "partially undressed, silla hwarang white wrap jacket pulled open, loosened white chest binding cloth strips hanging around ribs, faint red binding marks on skin, exposed medium breasts, red hairband, topknot, straddling his lap, kissing passionately",
        "boy": "sitting against riverside rock, holding her waist",
    },
    # ── Chapter 04 (삼국 통일기) ──
    "cg_ch04_gaon_h1": {
        "premodern": True,
        "env": "inside wooden cabin of ancient silla envoy ship anchored at gibeolpo at night, oil lantern, bamboo slips and vocabulary notebook dropped on wooden floor",
        "pose": "fellatio, oral, kneeling, penis in mouth, saliva",
        "girl": "partially undressed, teal silk jacket and inner top pulled open, exposed small breasts, nipples, silver hairclip, small brush behind ear, kneeling on wooden cabin floor, holding his penis with both hands, sucking with tongue out, saliva, teary blushing face",
        "boy": "standing in wooden ship cabin, hand on her head",
    },
    "cg_ch04_ara_h1": {
        "premodern": True,
        "env": "outdoors, river shore in shadow of large rock at sunset, orange evening sky, recurve bow and quiver leaning on rock",
        "pose": "cowgirl position, girl on top, straddling, vaginal",
        "girl": "partially undressed, goguryeo archer jacket and leather chest guard removed, exposed toned medium breasts, sweat on tan skin, pheasant feathers in high ponytail, short battle skirt lifted up, straddling and riding him dynamically, hands on his chest",
        "boy": "lying on back on fur cloak by the rock, gripping her toned thighs",
    },
    # ── Chapter 05 (남북국 시대) ──
    "cg_ch05_haerang_h1": {
        "premodern": True,
        "env": "inside ancient balhae dongmosan camp tent at night, crackling campfire, wet clothes drying by fire, thick animal fur pelt",
        "pose": "sitting embrace, breast fondling, nipple stimulation, foreplay, under fur pelt",
        "girl": "nude under a fur pelt draped over her shoulders, exposed medium breasts, nipples, sitting in his lap by the campfire, leaning back against his chest, blushing deeply, trembling as he fondles her breasts",
        "boy": "sitting behind her on fur pelt, embracing her and fondling her breasts with both hands",
    },
    "cg_ch05_ullim_h1": {
        "premodern": True,
        "env": "inside ancient bulguksa temple wooden bell pavilion at dusk, hanging giant bronze temple bell above, golden sound wave particles",
        "pose": "carrying sex, floating slightly in mid-air, face-to-face straddling, vaginal, hugging",
        "girl": "partially undressed, translucent pale jade celestial shawl swirling around her, sheer top slipped down, exposed small breasts, pink nipples, gold forehead jewel, gold armlets and anklets, floating in his arms with legs wrapped around his waist, teary ecstatic face",
        "boy": "standing under the bronze bell, lifting and holding her hips",
    },
    "cg_ch05_haerang_h2": {
        "premodern": True,
        "env": "inside balhae sanggyeong traditional wooden bedroom at night, low wooden sleeping platform with silk bedding, warm oil lamp",
        "pose": "missionary, pinned down, breast sucking, legs spread, vaginal",
        "girl": "draped only in a sheer red wedding silk cloth over her nude body, exposed medium breasts, bare thighs spread wide, wrists pinned lightly, moaning in embarrassment and pleasure",
        "boy": "on top of her, pinning her down, sucking her nipple while penetrating her",
    },
    # ── Chapter 06 (후삼국·나말여초) ──
    "cg_ch06_naru_h1": {
        "premodern": True,
        "env": "inside dark wooden cabin of moored ancient trading ship at cheonghaejin port at night, wooden plank wall",
        "pose": "standing sex, pinned against wooden wall, one leg lifted, breast sucking, vaginal",
        "girl": "partially undressed, indigo jeogori pulled off shoulders, exposed large breasts, small brass bell on hair tie, loose white trousers pulled down on one side, one leg lifted high around his waist, clinging to his neck",
        "boy": "standing, pressing her against the cabin wooden wall, sucking her breast while holding her lifted thigh",
    },
    "cg_ch06_sara_h1": {
        "premodern": True,
        "env": "inside ancient ulsan port spice warehouse at night, stacks of exotic persian carpets and spice sacks, brass oil lamp",
        "pose": "missionary on persian carpet, legs spread, vaginal",
        "girl": "nude except for silver coin necklace and gold earrings, central asian red silk caftan cast aside on carpet, exposed large breasts, curvy tan body, lying on back on ornate persian rug, legs spread, teary blushing face",
        "boy": "on top of her on the persian carpet, caressing her body and penetrating her",
    },
    "cg_ch06_haneui_h1": {
        "premodern": True,
        "env": "inside luxurious unified silla gyeongju noble house silk room on a snowy winter night, embroidered silk futon bedding (geumchim), folding screen, oil lamp",
        "pose": "missionary on silk bedding, legs spread wide, vaginal",
        "girl": "nude except for gold hairclips and gold drop earrings, purple silk hanbok cast aside, exposed medium breasts, pink nipples, fair skin, lying on back on silk futon, legs wrapped around his waist, moaning in ecstasy",
        "boy": "on top of her on the silk futon, penetrating deeply",
    },
    # ── Chapter 07 (고려 전기) ──
    "cg_ch07_maru_h1": {
        "premodern": True,
        "env": "moonlit wooden veranda (daecheongmaru) and open sliding door threshold of a goryeo noble house at night, polished wooden floor",
        "pose": "missionary on polished wooden floor, legs wrapped around waist, vaginal",
        "girl": "partially undressed, goryeo beige jeogori and green skirt pulled open, exposed medium breasts, ring of iron keys still hanging at her waist jingling, wooden hairclip, lying on wooden floor with legs wrapped around his waist, blushing",
        "boy": "on top of her on the moonlit wooden veranda floor",
    },
    "cg_ch07_seori_h1": {
        "premodern": True,
        "env": "inside warm ondol cottage room in northern goryeo seogyeong during a winter blizzard outside, warm yellow paper ondol floor and thick quilt",
        "pose": "missionary on ondol floor futon, legs spread, vaginal",
        "girl": "nude except for her fur-trimmed brown winter hat on her head, thick winter jacket cast aside, exposed small breasts, sweat on blushing skin, lying on back on warm ondol futon",
        "boy": "on top of her under the open quilt, holding her closely",
    },
    # ── Chapter 08 (고려 후기) ──
    "cg_ch08_soebyeol_h1": {
        "premodern": True,
        "env": "inside medieval goryeo blacksmith forge at night, glowing red charcoal furnace firelight, iron anvil, hammers and tongs",
        "pose": "sitting on anvil edge, missionary, legs wrapped around waist, vaginal",
        "girl": "nude, soot smudge on cheek, cloth headband, iron ring on finger, sweat-glistening toned tan body, exposed large breasts, sitting/leaning back on the iron anvil with legs spread wide around his waist, arms wrapped around his neck",
        "boy": "standing in front of the anvil between her legs, holding her hips and penetrating deeply",
    },
    "cg_ch08_danbi_h1": {
        "premodern": True,
        "env": "inside small hidden back room behind earthenware jangdokdae jars in a goryeo village house at night, moonlight through paper window, futon bedding",
        "pose": "missionary on futon, hand covering own mouth to muffle moans, vaginal",
        "girl": "partially undressed, neatly combed long black hair, pale pink goryeo jeogori and faded blue skirt pulled open, exposed flat chest, mole under eye, lying on futon, covering her mouth with both hands to stay quiet, blushing and trembling",
        "boy": "on top of her on the futon, embracing her petite body",
    },
    # ── Chapter 09 (고려 문화·벽란도) ──
    "cg_ch09_yeoul_h1": {
        "premodern": True,
        "env": "inside byeokrando merchant treasure warehouse at misty dawn, stacks of colorful song dynasty silk rolls and goryeo celadon vases",
        "pose": "missionary on pile of silk rolls, legs spread, arms around neck, vaginal",
        "girl": "partially undressed, jade green merchant jacket open, white skirt and inner trousers removed, exposed medium breasts, low twintails with blue hair ties, freckles, lying back on luxurious pile of silk rolls, arms around his neck, panting",
        "boy": "on top of her on the pile of silk rolls",
    },
    # ── Chapter 10 (조선 전기) ──
    "cg_ch10_sodam_h1": {
        "premodern": True,
        "env": "inside dark joseon gyeongbokgung palace confectionery kitchen (saenggwabang) at night, wooden kitchen counter table, tray of yakgwa honey cookies and spilled honey jar",
        "pose": "sitting on edge of kitchen counter table, missionary, legs spread, vaginal",
        "girl": "partially undressed, palace maid jeogori pulled open, exposed flat chest, red daenggi braid, blue chima skirt pushed up without underpants, honey and love juices on skin, sitting on edge of wooden kitchen table with legs spread",
        "boy": "standing between her legs at the kitchen counter, discarded female disguise wig nearby, holding her hips",
    },
    "cg_ch10_goyo_h1": {
        "premodern": True,
        "env": "behind the royal throne inside dark joseon gyeongbokgung palace hall at night, eerie glowing blue ghost fire and blue candle flames",
        "pose": "cowgirl position, girl on top, straddling his stomach like sleep paralysis, vaginal, cum in pussy",
        "girl": "partially undressed, white mourning hanbok (sobok) open, ghost girl, absurdly long black hair floating in mid-air, pale skin flushing bright crimson with yang energy, exposed small breasts, straddling on top of him, ecstatic eerie expression",
        "boy": "lying on back on the dark palace floor beneath her",
    },
    # ── Chapter 11 (양란) ──
    "cg_ch11_dodam_h1": {
        "premodern": True,
        "env": "inside joseon wartime medical relief tent at night, steam from herbal medicine clay pot, dried herbs hanging, low wooden cot with straw mat",
        "pose": "cowgirl position, girl on top, straddling, hands on his chest feeling pulse, vaginal",
        "girl": "nude except for traditional white Korean socks (beoseon) and red daenggi braid with herb sprig, light green physician jeogori cast aside, exposed medium breasts, straddling him on the cot, hands pressed against his chest, teary blushing face",
        "boy": "lying on back on the medical tent cot",
    },
    "cg_ch11_tsubaki_h1": {
        "premodern": True,
        "env": "inside moonlit wooden pavilion by camellia trees at busan waegwan compound at night, fallen red camellia flowers on tatami/wooden floor",
        "pose": "doggystyle, kneeling and bowing forward on all fours, from behind, vaginal",
        "girl": "partially undressed, red camellia flower in hime-cut hair, clumsily tied pink hanbok jeogori and white Japanese hadajuban inner robe slipping off shoulders, exposed medium breasts and pale ass, kneeling on all fours bowing down, looking back with teary eyes",
        "boy": "kneeling behind her on the pavilion floor, gripping her hips and penetrating from behind",
    },
    "cg_ch11_naru_h1": {
        "premodern": True,
        "env": "inside lower oar deck cabin of joseon panokseon warship at hansando sea at night, thick oak oar handles and hemp ropes",
        "pose": "missionary, leaning back over thick wooden oar beam, wrists lightly wrapped in ship rope, legs spread wide, vaginal",
        "girl": "nude, wet from seawater and sweat, small brass bell on purple braided hair, exposed large breasts, wrists voluntarily wrapped in hemp ship rope above head, lying back across wooden oar beam with legs spread wide",
        "boy": "on top of her between her spread legs inside the warship oar cabin",
    },
    # ── Chapter 12 (조선 후기 정치·기방 4자매·다모) ──
    "cg_ch12_maehyang_h1": {
        "premodern": True,
        "env": "inside joseon gisaeng house upper attic room at misty dawn, embroidered korean floor cushion (boryo) and folding screen, plum blossom branch in vase",
        "pose": "cowgirl position, girl on top, straddling, one finger touching his lips, vaginal",
        "girl": "partially undressed, long black hair let down with red plum blossom ornament, deep plum silk jeogori hanging off shoulders, red underskirt removed, exposed huge breasts, mole under mouth, straddling him on silk floor cushion, touching his lips with one hand",
        "boy": "lying on back on the silk floor cushion beneath her",
    },
    "cg_ch12_choryeon_h1": {
        "premodern": True,
        "env": "behind a painted silk folding screen in an empty joseon banquet hall late at night, flickering candlelight, six-string geomungo zither on floor",
        "pose": "doggystyle, leaning chest forward over geomungo zither body, from behind, fingers plucking zither strings, vaginal",
        "girl": "partially undressed, pink lotus hair ornament, pale pink jeogori and lilac chima half removed, exposed small breasts and slender hips, leaning forward over the wooden geomungo zither, one hand plucking the strings as her body rocks, blushing and biting lip",
        "boy": "kneeling behind her behind the folding screen, holding her waist",
    },
    "cg_ch12_hwaseon_h1": {
        "premodern": True,
        "env": "inside dark joseon banquet hall wooden floor at night, paper lantern glow",
        "pose": "standing sex, one leg lifted high onto his shoulder like a dancer, long silk sleeves wrapped around his neck, vaginal",
        "girl": "nude except for colorful butterfly/flower hairclips and long colorful dancing silk sleeves (hansam) wrapped around his neck and her wrists, exposed medium breasts, flexible dancer pose with one leg lifted straight up on his shoulder, winking and smiling in ecstasy",
        "boy": "standing, supporting her waist and lifted leg",
    },
    "cg_ch12_seola_h1": {
        "premodern": True,
        "env": "cramped space right behind a twelve-panel landscape folding screen during a joseon banquet at night, warm lantern light casting shadows of guests on the screen",
        "pose": "standing sex against wall behind folding screen, one thigh lifted, holding open flower fan hiding her mouth, vaginal",
        "girl": "partially undressed, white plum blossom hair ornament, jade green jeogori and rose chima pulled aside, exposed flat chest, mole under eye, pressed between wall and folding screen with one leg lifted, hiding her mouth behind an open painted fan to muffle moans, teary eyes",
        "boy": "standing close against her behind the folding screen, lifting her thigh",
    },
    "cg_ch12_choa_h1": {
        "premodern": True,
        "env": "inside warm back room of a joseon country tavern (jumak) outside jeongju fortress on a snowy night, ondol floor bedding, oil lamp",
        "pose": "missionary, wrists bound behind back with red hemp arrest rope, arched back, knees spread, vaginal",
        "girl": "nude, damo uniform cast aside, exposed medium breasts, both wrists tied with red podocheong arrest rope, yakgwa cookie held in mouth, lying on back on ondol bedding with knees spread wide, arching back in pleasure",
        "boy": "on top of her between her spread knees",
    },
    # ── Chapter 13 (조선 후기 사회·바다·단오) ──
    "cg_ch13_bada_h1": {
        "premodern": True,
        "env": "outdoors at night on jeju volcanic rock coast inside a stone windbreak circle (bulteok) with a crackling driftwood bonfire, dark sea waves",
        "pose": "missionary by bonfire, orange gourd float (tewak) propped under lower back raising hips, legs spread, vaginal",
        "girl": "partially undressed, wet white cotton haenyeo diving top slipped off one shoulder, exposed toned medium breasts, tan skin glistening with seawater and firelight, orange tewak gourd float under her lower back, legs spread wide, gasping",
        "boy": "on top of her by the coastal bonfire, holding her raised hips",
    },
    "cg_ch13_dano_h1": {
        "premodern": True,
        "env": "inside back bookroom of a late joseon rental bookstore (sechaekga) at songpa market at night, surrounded by stacks of old hangul storybooks, oil lamp",
        "pose": "missionary on floor surrounded by stacks of old books, holding an open hangul storybook in one hand, vaginal",
        "girl": "nude, red ribbon headband, tan petite body, exposed small breasts, lying on back amidst scattered old korean storybooks, trying to read from an open book in one hand while moaning and dropping it",
        "boy": "on top of her between her legs, thrusting deeply",
    },
    # ── Chapter 14 (개항기·가람·소담·보리) ──
    "cg_ch14_garam_h1": {
        "premodern": True,
        "env": "inside small rented traditional room in 1880s jemulpo port at night, matchlock musket hanging on wall, unrolled white cloth chest bindings on floor",
        "pose": "missionary on floor bedding under the hanging musket, hugging his hood with both hands, vaginal",
        "girl": "nude, red cloth hair tie, single braid, tan skin, hunter jeogori and white cotton chest binding bandage completely unwrapped, exposed medium breasts, lying on back, holding onto his hood with both hands, deep blush, crying out",
        "boy": "on top of her, penetrating deeply",
    },
    "cg_ch14_sodam_h1": {
        "premodern": True,
        "env": "inside dark palace kitchen attic during 1884 gapsin coup night, distant orange firelight flickering outside paper window",
        "pose": "face-to-face, sitting on lap, straddling inside his wide black coat/hoodie, hiding face against his chest, vaginal",
        "girl": "nude, hidden inside his wide open black coat, red daenggi braid, exposed flat chest, straddling his lap face-to-face, burying her blushing face against his chest, trembling",
        "boy": "sitting in dark attic corner, wrapping his coat around her and holding her small hips",
    },
    "cg_ch14_bori_h1": {
        "premodern": True,
        "env": "inside 1894 donghak peasant army cooking tent at night, steaming iron cauldron on clay stove, stacked straw rice sacks",
        "pose": "sitting/leaning back against stacked straw rice sacks, missionary/sitting sex, feeding him a warm rice ball while sucking her breast, vaginal",
        "girl": "nude, white cotton headband, white hemp clothes cast aside, curvy tan body, exposed large breasts, leaning back against straw rice sacks with legs spread around his waist, holding a warm rice ball to his mouth while he sucks her breast",
        "boy": "kneeling/leaning over her against the rice sacks, sucking her nipple while penetrating her",
    },
    # ── Chapter 15 (대한 제국·고요·엘리) ──
    "cg_ch15_goyo_h1": {
        "premodern": True,
        "env": "on royal carpet by western-style carved arch balustrade of jeonggwanheon pavilion at deoksugung palace at night, eerie blue ghost fire, spilled coffee cup",
        "pose": "missionary on royal pavilion carpet, white mourning skirt pushed up to waist, legs wrapped around waist, vaginal, cum in pussy",
        "girl": "partially undressed, korean virgin ghost white sobok jeogori open and white skirt pushed up to waist without underwear, exposed small breasts, pale thighs, dark coffee and saliva on lips, absurdly long black hair spread on carpet, flushing bright pink in ecstasy",
        "boy": "on top of her on the pavilion carpet, penetrating deeply",
    },
    "cg_ch15_ellie_h1": {
        "premodern": True,
        "env": "inside 1900s jeongdong red-brick western church at night, flickering candlelight, snow outside stained glass window, in front of pipe organ keyboard",
        "pose": "sitting on organ bench, reverse sitting/doggystyle leaning forward with hands pressing pipe organ keys, vaginal",
        "girl": "partially undressed, 1900s white lace high-collar blouse unbuttoned and pulled open, exposed large breasts, pink nipples, long navy skirt hiked up over hips, blonde wavy hair with navy ribbon, leaning forward with hands pressing the pipe organ keys as her hips rock back, teary blue eyes",
        "boy": "sitting/standing behind her on the pipe organ bench, holding her hips and thrusting from behind",
    },
    # ── Chapter 16 (국권 피탈기·한별) ──
    "cg_ch16_hanbyeol_h1": {
        "premodern": False,
        "env": "inside 1900s newspaper editorial office at night, oak reporting desk scattered with censored newspaper proofs and red ink stamp, warm desk lamp",
        "pose": "sitting on edge of oak reporting desk, skirt hiked up, legs spread, vaginal, dropping reporter notebook",
        "girl": "clothed sex, 1900s female student white jeogori unbuttoned at chest revealing medium breasts, long black chima skirt hiked up around waist, white hair ribbon, single braid, sitting on edge of wooden desk with legs wrapped around him, dropping her notebook and pen in ecstasy",
        "boy": "standing between her legs at the newspaper office desk, holding her waist",
    },
    # ── Chapter 17 (3·1 운동·상하이 춘메이) ──
    "cg_ch17_chunmei_h1": {
        "premodern": False,
        "env": "inside 1919 shanghai dumpling shop kitchen attic at night, wide wooden dough kneading table dusted with white flour, bamboo steamers",
        "pose": "mating press on flour-dusted wooden kitchen table, legs folded high up to shoulders, vaginal",
        "girl": "clothed sex, red 1920s cheongsam (qipao) front frog buttons undone revealing flour-dusted medium breasts, high side slits parted wide with no underwear, small wooden abacus still hanging at waist, double buns, food on face, lying on flour-dusted table with legs pressed back to her shoulders",
        "boy": "leaning over her on the dough table in a deep mating press, holding her thighs",
    },
    # ── Chapter 18 (1920년대·북간도 보리) ──
    "cg_ch18_bori_h1": {
        "premodern": True,
        "env": "inside 1920s northern gando independence army log cabin kitchen barracks at night, glowing firewood stove, pile of dry hay on floor",
        "pose": "cowgirl position on hay pile, naked apron, breastfeeding/lactation play, girl on top, vaginal",
        "girl": "naked apron, wearing only a plain white cotton kitchen apron over her nude curvy tan body, exposed large breasts dripping breast milk, lactation, single braid with white headband, straddling him on the hay pile and pressing her nipple to his mouth while riding him",
        "boy": "lying on back on the hay pile by the stove, sucking her breast while holding her hips",
    },
    # ── Chapter 19 (1930년대 문화·모던걸 한별) ──
    "cg_ch19_hanbyeol_h1": {
        "premodern": False,
        "env": "inside 1930s gyeongseong retro cafe (kkikdajeom) upstairs VIP room at night, velvet curtains, vintage gramophone, leather sofa, spilled cider glass",
        "pose": "missionary on vintage leather sofa, legs in garter belt stockings wrapped around his waist, vaginal, squirting/female ejaculation",
        "girl": "partially undressed, wet white lace blouse pulled off, black lace bra pushed up exposing medium breasts, wearing black garter belt, sheer stockings and high heels, single braid, lying back on leather sofa with garter-clad thighs wrapped around his waist, moaning in ecstasy",
        "boy": "on top of her on the leather sofa",
    },
    # ── Chapter 20 (광복·춘메이·새벽) ──
    "cg_ch20_chunmei_h1": {
        "premodern": False,
        "env": "inside 1932 shanghai provisional government upstairs rented room at misty dawn, folded futon bedding on wooden floor",
        "pose": "face-to-face, sitting on lap, straddling, deep kiss, arms wrapped tightly around his neck, vaginal, cum in pussy",
        "girl": "clothed sex, red qipao rolled up to waist and front unbuttoned exposing medium breasts, holding an independence bond envelope against his chest, double buns, straddling his lap on the futon, kissing him passionately while grinding her hips",
        "boy": "sitting on the futon, embracing her waist tightly",
    },
    "cg_ch20_saebyeok_h1": {
        "premodern": False,
        "env": "outdoors at night on grassy hill in 1940s xi'an under starry milky way sky, white silk parachute cloth spread on the grass like a sheet, discarded olive military uniform",
        "pose": "intimate missionary on white parachute silk cloth, gazing into each other's eyes, hands cupping his face, legs wrapped around waist, vaginal, defloration",
        "girl": "nude, 1940s korean liberation army uniform and field cap lying beside her on white parachute silk cloth, short black bob cut, exposed medium breasts pressed against his chest, cupping his unhooded face with both hands, teary loving eyes, legs wrapped around his waist",
        "boy": "hood down, shaded face from behind/side, on top of her on the white parachute cloth, embracing her tenderly",
    },
    # ── Chapter 22 (산업화·민주화·봄내) ──
    "cg_ch22_bomnae_h1": {
        "premodern": False,
        "env": "inside 1970s garment factory cutting room at winter night, wide cutting table piled with rolls of white wedding silk and cotton fabric, sewing machine nearby",
        "pose": "missionary on fabric-piled cutting table, wrists lightly bound together with a yellow tailor measuring tape, thimble on finger, vaginal",
        "girl": "nude, light blue factory work blouse and apron cast aside, white headband, short bob cut, exposed medium breasts, metal sewing thimble on middle finger, wrists loosely wrapped with yellow tailor measuring tape, lying back on piles of white fabric rolls, teary ecstatic face",
        "boy": "standing/leaning over the cutting table between her legs, penetrating deeply",
    },
    # ── Chapter 23 (현대·엄마 새벽·모아·다솜) ──
    "cg_ch23_saebyeok_h1": {
        "premodern": False,
        "env": "inside 1988 seoul old inn room on a stormy autumn night, rain hitting window, discarded wedding ring on floor, rumpled bed",
        "pose": "doggystyle on bed, arms pinned behind back, hair pulled, rough sex, mutual crying, tears from both, vaginal, cum in pussy",
        "girl": "partially undressed, wet 1980s cream silk blouse torn open and navy skirt bunched up, mature curvy body, exposed huge breasts, hair bun coming undone, on all fours on inn bed with arms pinned behind her back, crying tears of submission and ecstasy",
        "boy": "black hoodie with hood down, red-rimmed eyes streaming with hot tears of betrayal and furious possessive love, kneeling behind her on the bed, holding her wrists and hair, thrusting roughly",
    },
    "cg_ch23_moa_h1": {
        "premodern": False,
        "env": "inside 2002 neon-lit underground karaoke room (noraebang) at night, spinning disco mirror ball, leather karaoke sofa, tambourine",
        "pose": "mating press on karaoke leather sofa, legs lifted high in loose socks, holding tambourine, vaginal",
        "girl": "clothed sex, gyaru, 2002 red devils world cup t-shirt tied up above exposed medium breasts, glowing red devil horn headband, denim miniskirt pushed up, white loose socks, tan skin, pinned back on karaoke sofa with legs lifted high, holding a tambourine in one hand, moaning",
        "boy": "on top of her on the karaoke sofa, pressing her legs back and penetrating deeply",
    },
    "cg_ch23_dasom_h1": {
        "premodern": False,
        "env": "inside 1980s university song club room at night, acoustic guitar and sheet music notebooks scattered on floor",
        "pose": "cowgirl position, girl on top, straddling on floor mat amidst sheet music, hands on his chest, vaginal, cum in pussy",
        "girl": "nude, college blouse and jeans cast aside near acoustic guitar, straight black medium hair with blunt bangs, exposed medium breasts, straddling and riding him boldly, blushing determined and ecstatic expression",
        "boy": "lying on back on the club room floor mat, holding her hips",
    },
    # ── Chapter 24 (개별 히로인 엔딩 H씬 36종) ──
    "cg_end_dodam_h1": {
        "premodern": True,
        "env": "inside joseon medical clinic (hwarinseo) herb storage room at dawn, sacks of dried medicinal herbs, acupuncture needle pouch",
        "pose": "missionary on medicinal herb sacks, thighs spread wide, vaginal, cum in pussy",
        "girl": "partially undressed, light green physician jeogori removed, exposed medium breasts, red daenggi braid, indigo chima pushed up, lying back on sacks of medicinal herbs with thighs spread wide, blushing and moaning",
        "boy": "on top of her between her spread thighs, penetrating deeply",
    },
    "cg_end_ara_h1": {
        "premodern": True,
        "env": "outdoors behind archery target at ancient bodeokguk archery field at misty dawn, wooden target and arrows",
        "pose": "standing doggystyle from behind, one leg lifted high, holding recurve bow, vaginal",
        "girl": "clothed sex, goguryeo archer jacket open exposing toned medium breasts, battle skirt hiked up, pheasant feathers in ponytail, standing on one leg with other leg lifted high by him from behind, gripping her recurve bow string tightly while moaning",
        "boy": "standing behind her, holding her lifted thigh and waist while penetrating from behind",
    },
    "cg_end_gaon_h1": {
        "premodern": True,
        "env": "outdoors in rock shadow at gibeolpo river shore at sunrise, warm dawn light, dropped bundle of bamboo slips on ground",
        "pose": "face-to-face, sitting on lap, straddling, deep french kiss, arms around neck, vaginal",
        "girl": "partially undressed, teal silk jacket open exposing small breasts, white pleated skirt spread over his lap, silver hairclip, straddling him face-to-face, bamboo slips dropped beside her, kissing deeply with tongue",
        "boy": "sitting against rock, holding her hips closely",
    },
    "cg_end_maru_h1": {
        "premodern": True,
        "env": "on polished wooden veranda floor (daecheongmaru) of goryeo gochang mansion in morning sunlight",
        "pose": "mating press / folded legs missionary on wooden floor, iron key ring jingling at waist, vaginal, cum in pussy",
        "girl": "partially undressed, goryeo jeogori open exposing medium breasts, skirt pushed up, ring of iron keys at waist, lying on wooden floor with legs folded back to shoulders, blushing deeply",
        "boy": "on top of her on the wooden floor, pressing her thighs down and penetrating deeply",
    },
    "cg_end_seori_h1": {
        "premodern": True,
        "env": "inside covered wagon tent by daedong river during first winter snowfall, thick fur pelt bedding",
        "pose": "prone bone / spooning from behind on fur bedding, lying on stomach, vaginal",
        "girl": "nude except for fur-trimmed winter hat on her head, exposed small breasts pressed against fur bedding, lying prone on stomach while he embraces her closely from behind, blushing and panting",
        "boy": "lying on top of her from behind on the fur bedding, hugging her waist and whispering in her ear",
    },
    "cg_end_soebyeol_h1": {
        "premodern": True,
        "env": "inside goryeo daincheolso blacksmith forge at dawn, glowing red furnace fire, iron anvil workbench",
        "pose": "standing doggystyle, leaning forward with hands on iron anvil, fingers interlocked with his left hand wearing iron ring, vaginal",
        "girl": "nude, soot smudge on cheek, cloth headband, toned tan body, large breasts hanging down, leaning forward with hands on iron anvil and ass raised high, interlocking fingers with his hand showing matching iron rings",
        "boy": "standing behind her at the anvil, holding her hip and interlocking fingers with her left hand",
    },
    "cg_end_danbi_h1": {
        "premodern": True,
        "env": "outdoors behind large earthenware jangdokdae jars in a misty gaegyeong alley at dawn",
        "pose": "standing carrying sex (ekiben), lifted in his arms with knees hooked over his elbows, covering mouth, vaginal",
        "girl": "clothed sex, pale pink goryeo jeogori open exposing flat chest, faded blue skirt hiked up, neatly combed long black hair, mole under eye, lifted off the ground in his arms with legs spread wide, covering her mouth with one hand, teary eyes",
        "boy": "standing behind the earthenware jars, lifting her thighs in his arms and penetrating from below",
    },
    "cg_end_bomnae_h1": {
        "premodern": False,
        "env": "inside 1970s night school sewing classroom at dawn, wide sewing machine worktable, morning light through window",
        "pose": "clothed missionary on sewing worktable, wearing handmade white wedding dress with skirt hiked up, tailor measuring tape looped around his neck, vaginal",
        "girl": "clothed sex, wearing her handmade white wedding dress with bodice open exposing medium breasts and wedding skirt pushed up around waist, white headband, looping a yellow measuring tape around his neck to pull him close, legs wrapped around his waist",
        "boy": "standing at the sewing worktable leaning over her between her legs",
    },
    "cg_end_haneui_h1": {
        "premodern": True,
        "env": "outdoors in shadow of traditional tiled stone wall of gyeongju noble mansion at dawn",
        "pose": "standing sex against tiled stone wall, one leg lifted high, breast and clitoris caress, vaginal",
        "girl": "partially undressed, purple silla silk skirt and inner trousers dropped to ankles, jacket open exposing medium breasts, gold drop earrings, hands braced against stone wall with one leg lifted high, gasping in pleasure",
        "boy": "standing behind/beside her against the wall, caressing her breast and clitoris while penetrating her",
    },
    "cg_end_yeoul_h1": {
        "premodern": True,
        "env": "inside byeokrando merchant silk warehouse at dawn, piles of colorful song dynasty silk rolls and celadon vases",
        "pose": "mating press on pile of silk rolls, legs resting on his shoulders, vaginal, cum in pussy",
        "girl": "nude, brown wavy low twintails with blue hair ties, freckles, exposed medium breasts, lying on back on colorful silk rolls with both legs lifted onto his shoulders, teary ecstatic expression",
        "boy": "leaning over her in a deep mating press on the silk rolls, penetrating to the hilt",
    },
    "cg_end_naru_h1": {
        "premodern": True,
        "env": "on wooden ferry boat drifting on han river at sunset, golden water reflection",
        "pose": "cowgirl position on wooden boat floor, girl on top, straddling, vaginal",
        "girl": "partially undressed, indigo hemp jeogori pulled open exposing large breasts, small brass bell on purple braided hair, straddling and riding him on the drifting wooden ferry floor, rocking her hips",
        "boy": "lying on back on the wooden ferry boat floor, holding her waist",
    },
    "cg_end_sodam_h1": {
        "premodern": True,
        "env": "inside joseon gyeongbokgung palace saenggwabang pantry room, wooden table with jar of honey syrup and yakgwa cookies",
        "pose": "sitting on pantry table edge, missionary, legs spread wide, holding yakgwa cookie in mouth, vaginal",
        "girl": "clothed sex, green palace maid jeogori open exposing flat chest, blue chima skirt and inner trousers removed, red daenggi braid, sitting on wooden table with legs spread wide, biting a yakgwa honey cookie in her mouth while moaning",
        "boy": "standing between her spread legs at the pantry table, penetrating her honey-slicked pussy",
    },
    "cg_end_maehyang_h1": {
        "premodern": True,
        "env": "on wooden railing of a moonlit joseon garden pavilion at night, blooming plum blossom tree with falling petals",
        "pose": "face-to-face sitting on lap by pavilion railing, one leg draped over wooden railing, deep kiss, vaginal",
        "girl": "partially undressed, plum silk gisaeng jeogori slipped off shoulders exposing huge breasts, navy chima hiked up, red plum blossom hair ornament, sitting on his lap on the pavilion railing, kissing him with teary eyes",
        "boy": "sitting against the pavilion railing, holding her curvy body closely",
    },
    "cg_end_choryeon_h1": {
        "premodern": True,
        "env": "inside moonlit joseon gisaeng house wooden room at night, paper window, geomungo zither placed near pillow",
        "pose": "missionary on wooden floor futon, wrists loosely bound above head with her own silk sash, legs spread wide, vaginal",
        "girl": "nude, pink lotus hair ornament, exposed small breasts, slender body, wrists loosely tied with her magenta silk otgoreum ribbon and pinned above her head near the geomungo, legs spread wide, blushing and moaning honestly",
        "boy": "on top of her, holding her bound wrists above her head while penetrating her",
    },
    "cg_end_hwaseon_h1": {
        "premodern": True,
        "env": "inside joseon inn room at night, warm glow of hanyang lantern festival outside paper window, traditional bronze mirror stand",
        "pose": "reverse cowgirl position, girl on top facing away, wearing only long colorful saekdong dancing sleeves on arms, looking back and winking, vaginal",
        "girl": "nude except for colorful flower hairclips and long saekdong dancing sleeves draped over her arms, exposed medium breasts, straddling him in reverse cowgirl, bouncing her ass and looking back over her shoulder with a playful wink",
        "boy": "lying on back on the inn room floor bedding, holding her hips",
    },
    "cg_end_seola_h1": {
        "premodern": True,
        "env": "inside joseon garden pavilion during quiet heavy snowfall at night, wrapped together inside a thick fur-lined silk vest and dark cloak",
        "pose": "face-to-face sitting on lap, straddling under shared cloak/fur vest, hugging closely, vaginal",
        "girl": "partially undressed under shared cloak and red chima covering them, white plum blossom hair ornament, exposed flat chest pressed against him, mole under eye, straddling his lap closely, teary blushing face",
        "boy": "sitting in the snowy pavilion, wrapping his coat around her petite body while penetrating from below",
    },
    "cg_end_hanbyeol_h1": {
        "premodern": False,
        "env": "inside 1930s gyeongseong boarding house room, vintage iron-frame western bed",
        "pose": "clothed missionary on vintage bed, wearing unbuttoned blouse and black garter belt stockings, holding manuscript paper, wearing round glasses, vaginal",
        "girl": "clothed sex, wearing round reading glasses, 1930s blouse pulled open exposing medium breasts, black garter belt and stockings, clutching an article manuscript sheet in one hand, lying on bed with legs wrapped around his waist, tongue out and teary eyes behind glasses",
        "boy": "on top of her on the 1930s bed",
    },
    "cg_end_bori_h1": {
        "premodern": True,
        "env": "inside mountain cottage kitchen at night, warm fire glowing in clay hearth (agung-i), thick pile of straw on floor",
        "pose": "face-to-face sitting on lap on straw pile, breastfeeding/nursing him at her breast while straddling, lactation, vaginal",
        "girl": "partially undressed, white hemp jeogori removed exposing large breasts dripping milk, white skirt hiked up, white headband, straddling his lap on the straw pile and cradling his head against her breast to nurse him while smiling blissfully",
        "boy": "sitting on the straw pile by the hearth fire, nursing at her breast while penetrating her from below",
    },
    "cg_end_dano_h1": {
        "premodern": True,
        "env": "behind stage curtain of joseon songpa market sandaenori performance tent at sunset, wooden costume trunk",
        "pose": "sitting on wooden costume trunk, missionary with one leg lifted onto his shoulder, hiding mouth behind folding fan, vaginal",
        "girl": "partially undressed, yellow jeogori and inner trousers removed, exposed small breasts, red ribbon headband, sitting back on wooden costume trunk with one leg on his shoulder, covering her mouth with a storyteller folding fan, teary blushing eyes",
        "boy": "standing in front of the costume trunk between her legs, holding her thigh",
    },
    "cg_end_haerang_h1": {
        "premodern": True,
        "env": "inside snowy northern border log cabin at night, thick deer fur pelt on floor",
        "pose": "missionary on deer fur pelt, wearing only open fur-trimmed hunting coat, breast grab, legs spread, vaginal",
        "girl": "partially undressed, wearing only an open balhae fur-trimmed hunting coat over her nude body, exposed medium breasts grabbed by his hand, side ponytail, lying on deer fur pelt with long toned legs spread, teary submissive expression",
        "boy": "on top of her on the deer fur pelt, gripping her breast and penetrating deeply",
    },
    "cg_end_garam_h1": {
        "premodern": True,
        "env": "inside late joseon jemulpo traditional room at sunset, warm orange light through paper door, matchlock musket hanging on wall",
        "pose": "face-to-face sitting on lap, straddling, pressing his palm against her left breast to feel heartbeat, vaginal",
        "girl": "partially undressed, dark green hunter jeogori pulled open exposing medium breasts, red hair tie, single braid, tan skin, straddling his lap under the hanging musket, pressing his hand against her chest, panting and blushing",
        "boy": "sitting on the floor mat, holding her waist and pressing his palm to her breast",
    },
    "cg_end_ullim_h1": {
        "premodern": True,
        "env": "on wooden floor of odaesan sangwonsa temple bell pavilion at misty dawn, giant bronze bell above",
        "pose": "missionary on wooden bell pavilion floor, wearing headphones around neck and translucent celestial shawl, legs spread wide, vaginal",
        "girl": "nude except for modern headphones around her neck, gold forehead jewel, and translucent pale jade celestial shawl draped around arms, exposed small breasts, gradient green hair spread on wooden floor, legs spread wide, ecstatic moaning",
        "boy": "on top of her on the temple bell pavilion floor",
    },
    "cg_end_noeul_h1": {
        "premodern": True,
        "env": "inside ancient asadal rocky cave at red sunset, animal fur pelt on cave floor",
        "pose": "doggystyle on all fours on fur pelt, tiger tail wrapped around his arm, neck bite, vaginal, cum in pussy",
        "girl": "nude, tiger girl, orange streaked hair, tiger ears flattened back, huge breasts hanging down, striped tiger tail coiled around his forearm, on all fours on cave fur pelt, looking back with fang showing and moaning",
        "boy": "kneeling behind her in the cave, biting her neck gently while gripping her hips and penetrating from behind",
    },
    "cg_end_dallae_h1": {
        "premodern": True,
        "env": "inside ancient wanggeomseong market stall tent at night, oil lamp, piles of silk bundles on merchant counter",
        "pose": "cowgirl position on silk bundles, girl on top, hugging wooden tally ledger against chest, vaginal, cum in pussy",
        "girl": "nude, wooden hairclip in hair bun, exposed medium breasts, hugging her wooden tally ledger plaque to her chest while straddling and riding him on top of silk bundles, seductive blushing expression",
        "boy": "lying on back on the merchant silk bundles, holding her hips",
    },
    "cg_end_saebyeok_h1": {
        "premodern": False,
        "env": "inside 1950s busan wartime tent school classroom in morning sunlight, old reed organ and wooden teacher desk",
        "pose": "clothed missionary on wooden desk next to reed organ, hugging liberation army cap, cupping his unhooded face, legs wrapped around waist, vaginal, cum in pussy",
        "girl": "clothed sex, young saebyeok, blouse and skirt half undone on wooden desk, exposed medium breasts, holding her faded olive liberation army cap with one arm while cupping his face, teary eyes, legs wrapped tightly around his waist",
        "boy": "standing at the classroom desk leaning over her, hood down",
    },
    "cg_end_dasom_h1": {
        "premodern": False,
        "env": "inside 1988 university student union song club room, old sofa, acoustic guitar leaning nearby",
        "pose": "clothed missionary on old club room sofa, t-shirt rolled up above breasts, jeans and panties hanging on one ankle, legs wrapped around waist, vaginal",
        "girl": "clothed sex, white t-shirt pushed up exposing medium breasts, light blue jeans pulled down and hanging off one ankle, blunt bangs, lying on old sofa with legs wrapped around his waist, moaning passionately",
        "boy": "on top of her on the club room sofa",
    },
    "cg_end_irang_h1": {
        "premodern": True,
        "env": "outdoors in rock shadow by seorabeol stream at sunset, clear water and boulders",
        "pose": "missionary leaning back against riverside boulder, wearing feminine silla silk hanbok with skirt hiked up, legs held wide, vaginal",
        "girl": "clothed sex, wearing feminine silla silk jeogori pulled open exposing medium breasts and silk chima skirt hiked up to waist, long black hair let down from topknot, leaning back against boulder with legs held wide, tongue out in shy pleasure",
        "boy": "kneeling/standing between her legs against the boulder, holding her thighs",
    },
    "cg_end_eunsil_h1": {
        "premodern": True,
        "env": "inside warm candlelit traditional wooden room at night, gaya iron ingot hanging on wall, twelve-string gayageum zither right beside futon bedding",
        "pose": "missionary on futon beside gayageum zither, one hand reaching out plucking gayageum strings, vaginal",
        "girl": "nude, very long straight black hair spread on futon, exposed flat chest, jade comma bead necklace, lying on back under him, one hand resting on the strings of the gayageum zither beside the futon, teary ecstatic face",
        "boy": "on top of her on the futon",
    },
    "cg_end_sara_h1": {
        "premodern": True,
        "env": "inside ancient ulsan port spice and carpet warehouse at dawn, ornate persian rugs and incense burners",
        "pose": "cowgirl position on persian carpet, wearing only gold jewelry and sheer veil, girl on top dancing hips, vaginal",
        "girl": "nude except for gold earrings, silver coin necklace and sheer translucent veil, long wavy red hair, tan curvy body, exposed large breasts, straddling and riding him like a swirling dancer on the persian carpet",
        "boy": "lying on back on the persian carpet, hands on her curvy hips",
    },
    "cg_end_choa_h1": {
        "premodern": True,
        "env": "inside candlelit traditional joseon room at night, wooden floor and futon",
        "pose": "doggystyle on all fours, shibari rope bondage with red arrest rope binding breasts and arms behind back, vaginal",
        "girl": "nude, bound in red podocheong arrest rope around her torso emphasizing her medium breasts and tying her arms behind her back, kneeling on all fours with ass raised high, looking back with teary blushing eyes",
        "boy": "kneeling behind her, holding the red rope and her hips while penetrating from behind",
    },
    "cg_end_bada_h1": {
        "premodern": True,
        "env": "inside coastal sea cave in jeju at sunset, crashing waves at cave entrance, wet rock wall",
        "pose": "standing carrying sex against sea cave rock wall, wet haenyeo swimsuit pulled aside, legs wrapped around waist, vaginal",
        "girl": "clothed sex, wet white cotton haenyeo diving suit pulled aside exposing toned medium breasts and groin, wet short wavy black hair, tan skin, lifted against cave rock wall with legs wrapped tightly around his waist, crying out in pleasure",
        "boy": "standing against the sea cave wall, lifting her and penetrating deeply",
    },
    "cg_end_ellie_h1": {
        "premodern": True,
        "env": "inside 1900s jeongdong traditional hanok room in evening sunlight through paper window, antique reed organ and bench",
        "pose": "face-to-face sitting on lap on reed organ bench, back pressing organ keys, deep kiss, vaginal",
        "girl": "partially undressed, 1900s white lace blouse unbuttoned exposing large breasts, long navy skirt spread over bench, blonde wavy hair, straddling his lap on the organ bench with her back pressing the keys, kissing him with teary blue eyes",
        "boy": "sitting on the reed organ bench, holding her waist closely",
    },
    "cg_end_goyo_h1": {
        "premodern": True,
        "env": "inside hyangwonjeong pond pavilion at gyeongbokgung palace at misty night, eerie glowing blue ghost fire, pond reflection",
        "pose": "missionary on wooden pavilion floor, white mourning hanbok spread open, tongue kiss, vaginal, cum in pussy",
        "girl": "partially undressed, korean virgin ghost white sobok spread open on wooden floor, absurdly long black hair covering the floor, exposed small breasts, pale skin flushing crimson, legs wrapped around his waist, tongue sucked in deep kiss",
        "boy": "on top of her on the pavilion floor, kissing her tongue and penetrating deeply",
    },
    "cg_end_moa_h1": {
        "premodern": False,
        "env": "on wooden bench (pyeongsang) on a seoul building rooftop at night in 2002, city night lights in background",
        "pose": "clothed mating press / folded legs missionary on rooftop wooden bench, crop tee lifted, low-rise jeans at knees, loose socks, peace sign hand faltering, vaginal",
        "girl": "clothed sex, gyaru, 1990s/2002 white crop tee pulled up exposing tan medium breasts, baggy jeans and panties pulled down to one knee, white loose socks, legs lifted high on rooftop bench, trying to make a v peace sign with teary blushing face",
        "boy": "on top of her on the rooftop wooden bench, holding her legs up",
    },
    "cg_end_tsubaki_h1": {
        "premodern": True,
        "env": "outdoors in camellia forest grove outside busan waegwan wall at sunset, thick carpet of fallen red camellia flowers on ground",
        "pose": "missionary on carpet of fallen red camellia blossoms, holding handmade vocabulary notebook in one hand, legs wrapped around waist, vaginal",
        "girl": "partially undressed, pink hanbok jeogori and japanese kosode collar pulled open exposing medium breasts, indigo chima pushed up, red camellia in hime-cut hair, lying on bed of fallen red camellia flowers, clutching her small vocabulary notebook, moaning",
        "boy": "on top of her on the fallen camellia flowers",
    },
    "cg_end_chunmei_h1": {
        "premodern": False,
        "env": "inside 1920s shanghai dumpling shop upstairs attic bedroom at night, vintage iron bed, warm lamp",
        "pose": "clothed mating press / folded legs missionary in red qipao on bed, side slits open, vaginal, cum in pussy",
        "girl": "clothed sex, red silk qipao front frog buttons undone exposing medium breasts, high side slits pulled up over hips, double buns, legs folded deeply back on the attic bed, blushing and squeezing tightly",
        "boy": "on top of her on the bed, pressing her folded legs and penetrating deeply",
    },
    "cg_end_orpheia_h1": {
        "premodern": False,
        "env": "inside modern home music studio at night, glowing dual monitors and audio mixing console desk",
        "pose": "clothed face-to-face sitting on edge of music studio desk, maid dress open, white garter thighhighs, legs wrapped around waist, deep kiss, vaginal",
        "girl": "clothed sex, wearing black and white frilled maid dress unbuttoned at chest exposing large breasts, maid headdress, green hair ribbon, very long white hair, white garter thighhighs, sitting on edge of mixing desk with legs wrapped around his waist, teary happy kiss",
        "boy": "standing at the mixing console desk between her legs, embracing and kissing her",
    },
    "cg_end_muk_h1": {
        "premodern": False,
        "env": "inside modern music studio at night, open wrong-answer notebook spread on wooden desk, floating ink droplets",
        "pose": "cowgirl position on desk over open notebook, unraveling black ink ribbons, girl on top, vaginal",
        "girl": "partially undressed, black and white ink ribbon dress half unraveled exposing flat chest, petite pale body, hair tips dissolving into ink droplets, straddling him on the desk over the open notebook, wistful seductive smile",
        "boy": "sitting/leaning back on the studio desk beneath her, holding her petite waist",
    },
    # ── Side Stories sp03, sp04 ──
    "cg_sp03_saebyeok_h1": {
        "premodern": False,
        "env": "inside modern bedroom at night, bed with rumpled sheets, dim lamp",
        "pose": "deep mating press on bed, legs folded over shoulders, wrists and hair pinned down, rough sex, vaginal, cum in pussy",
        "girl": "nude, mature curvy body, exposed huge breasts pressed down, hair bun undone, lying on back on bed with legs folded all the way up to her shoulders, wrists pinned, teary eyes gazing up in submission and ecstasy",
        "boy": "hood down, on top of her in a dominant mating press, pinning her wrists and penetrating deeply",
    },
    "cg_sp04_ellie_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed, warm bedside lamp",
        "pose": "cowgirl position on bed, wearing open white lace nightgown off shoulders, girl on top, vaginal",
        "girl": "partially undressed, white western lace nightgown slipped off shoulders exposing large breasts, long wavy blonde hair, blue eyes, freckles, straddling and riding him passionately on the bed",
        "boy": "lying on back on the bed, hands on her hips",
    },
    # ── Side Story sp05 (화기애애한 밤 36종 — 상철의 현대 집/작업실 침실) ──
    "cg_sp05_noeul_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed, warm lamp",
        "pose": "doggystyle on all fours on bed, striped tiger tail wrapped around his waist, neck bite, flattened tiger ears, vaginal",
        "girl": "nude, tiger girl, orange streaked hair, flattened tiger ears, exposed huge breasts, striped tiger tail coiled around his waist, on all fours on bed, tongue out moaning",
        "boy": "kneeling behind her on bed, kissing/biting her neck while penetrating from behind",
    },
    "cg_sp05_dallae_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "paizuri on bed, straddling his stomach, squeezing medium breasts around penis, licking glans with tongue tip",
        "girl": "nude, wooden hairclip in hair bun, straddling his stomach on bed, squeezing her saliva-slicked medium breasts around his penis and licking the tip with a cheerful smile",
        "boy": "lying on back on bed as she performs paizuri",
    },
    "cg_sp05_irang_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed, unwrapped chest bandage strips on sheet",
        "pose": "cowgirl position / straddling his thigh on bed, hands covering own mouth in embarrassment, vaginal",
        "girl": "nude, long black hair let down and wet with sweat, chest binding cloth completely removed, exposed medium breasts, straddling him on bed, covering her blushing mouth with both hands, teary eyes",
        "boy": "lying/sitting on bed beneath her, holding her hips",
    },
    "cg_sp05_eunsil_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, wooden bed headboard",
        "pose": "doggystyle / standing leaning against bed headboard, arched back, breast and clitoris stimulation, squirting, vaginal",
        "girl": "nude, very long straight black hair, exposed flat chest, petite slender body, hands gripping the bed headboard, arching her back as his fingers caress her nipple and clitoris, trembling in climax",
        "boy": "behind her on the bed, caressing her nipple and clitoris while penetrating from behind",
    },
    "cg_sp05_naru_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "folded legs missionary on bed after footjob, faint blue water glow on ankles, brass hair bell jingling, vaginal",
        "girl": "nude, purple braided hair with small brass bell, exposed large breasts, faint blue water glow around her bare ankles and feet, lying on bed with legs spread wide and lifted, blissful smile",
        "boy": "on top of her on bed, holding her glowing ankles",
    },
    "cg_sp05_ara_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "cowgirl position on bed, girl on top riding dynamically like horseback, hands on his chest, vaginal",
        "girl": "nude, high black ponytail, toned tan body, exposed medium breasts bouncing with sweat, straddling and riding him on the bed, hands braced on his chest, panting heavily",
        "boy": "lying on back on bed, gripping her toned waist",
    },
    "cg_sp05_gaon_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "missionary on bed after fellatio, legs spread, blushing deeply while speaking/reporting aloud, vaginal",
        "girl": "nude, black hair bun, petite body, exposed small breasts, saliva on lips, lying on back on bed with legs wrapped around his waist, trembling in embarrassment as she talks aloud during sex",
        "boy": "on top of her on bed, leaning close to her ear",
    },
    "cg_sp05_haerang_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed, small bottle of fragrant body oil on nightstand",
        "pose": "missionary on bed, oiled shiny skin glistening, sniffing her neck, vaginal",
        "girl": "nude, oiled glistening body, brown side ponytail, exposed medium breasts shining with fragrant oil and sweat, lying on bed wrapping her arms around him, eyes closed in sweet sigh",
        "boy": "on top of her on bed, burying his face in her oiled neck while penetrating her",
    },
    "cg_sp05_ullim_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed, glowing golden sound wave ripples",
        "pose": "face-to-face sitting on lap, floating slightly above bed, wearing headphones around neck and translucent shawl, vaginal",
        "girl": "nude except for headphones around neck, gold forehead jewel and sheer jade celestial shawl floating in air, exposed small breasts, gradient green floating hair, straddling his lap in mid-air, glowing golden ripples",
        "boy": "sitting on bed, holding her floating waist",
    },
    "cg_sp05_sara_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "missionary on bed, red hair spread on white sheets, toes tracing his lower belly, wearing only silver coin necklace, vaginal",
        "girl": "nude except for silver coin necklace and gold earrings, long wavy red hair spread over bed sheets, curvy tan body, exposed large breasts, lying on back with her toes curling against his lower stomach, sparkling orange eyes",
        "boy": "on top of her on bed",
    },
    "cg_sp05_haneui_h1": {
        "premodern": False,
        "env": "inside modern apartment room at night by large glass balcony window overlooking city lights, steam on glass",
        "pose": "standing doggystyle against glass balcony window, silk loungewear skirt hiked up, interlocked fingers against glass, vaginal",
        "girl": "partially undressed, sheer lavender robe open exposing medium breasts, skirt hiked up around waist, gold hairclip, standing pressed against the fogged glass balcony window, interlocking fingers with his hand",
        "boy": "standing behind her by the balcony window, holding her hand and penetrating from behind",
    },
    "cg_sp05_maru_h1": {
        "premodern": False,
        "env": "inside cozy modern room at night, messy rumpled futon bedding on floor, iron key ring by pillow",
        "pose": "missionary on rumpled futon, legs wrapped tightly around his waist, vaginal, cum in pussy",
        "girl": "nude, black braided bun coming loose, exposed medium breasts, ring of keys jingling by the pillow, lying on rumpled futon with legs locked tightly around his waist, composed expression melting into ecstasy",
        "boy": "on top of her on the futon, penetrating deeply",
    },
    "cg_sp05_seori_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, under a thick three-layered quilt blanket",
        "pose": "spooning sex on side under thick quilt, breast fondling from behind, biting blanket corner, vaginal",
        "girl": "nude under thick quilt blanket, brown side braid, exposed small breasts fondled by his hands from behind, lying on her side closely pressed against him, biting the edge of the blanket with flushed cheeks and ears",
        "boy": "lying on his side behind her under the quilt, fondling her breasts and nibbling her earlobe while penetrating from behind",
    },
    "cg_sp05_yeoul_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed, fake marriage contract paper tucked under pillow",
        "pose": "missionary on bed, legs wrapped around waist, red lipstick/kiss marks on her lower belly, vaginal, cum in pussy",
        "girl": "nude, brown wavy low twintails with blue hair ties, freckles, exposed medium breasts, red kiss marks stamped across her lower belly, contract paper peeking from under pillow, hugging his neck with teary smile",
        "boy": "on top of her on bed, kissing her lower belly and penetrating deeply",
    },
    "cg_sp05_soebyeol_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "missionary on bed, both hands interlocked with his above her head with matching iron rings clinking, vaginal",
        "girl": "nude, short messy black hair, toned tan body glistening with sweat, exposed large breasts, lying on back on bed with both hands interlocked with his above her head, matching iron rings on fingers",
        "boy": "on top of her on bed, interlocking both hands with hers above her head",
    },
    "cg_sp05_danbi_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "face-to-face sitting on lap on bed, gentle hair stroking, hugging petite body closely, vaginal",
        "girl": "nude, petite body, exposed flat chest, mole under eye, long black hair being gently stroked by his hand, sitting on his lap face-to-face, clinging to his neck and trembling in climax",
        "boy": "sitting on bed, embracing her small body and stroking her hair",
    },
    "cg_sp05_sodam_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, edge of bed",
        "pose": "fellatio kneeling at edge of bed, hair tied up high with cute ribbon scrunchie, penis in mouth, saliva",
        "girl": "nude, black hair tied up with a cute ribbon hair tie, petite body, exposed flat chest, kneeling between his legs at the edge of the bed, sucking his penis earnestly with tongue and lips",
        "boy": "sitting/lying at the edge of the bed, hand resting on her head",
    },
    "cg_sp05_goyo_h1": {
        "premodern": False,
        "env": "inside dark modern bedroom at night, eerie glowing blue ghost fire around bed, white steam rising",
        "pose": "cowgirl position on bed, sleep paralysis ghost riding on top of his stomach, vaginal, cum in pussy",
        "girl": "nude, ghost girl, absurdly long black hair floating around bed, exposed small breasts, pale skin turning bright pink with rising white steam as she drains his yang energy, straddling on top of him",
        "boy": "lying on back on the bed beneath her",
    },
    "cg_sp05_dodam_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed, herbal medicine bowl on nightstand",
        "pose": "cowgirl position on bed, wearing half-open hanbok/pajama top, girl on top, tongue out in climax, vaginal",
        "girl": "partially undressed, top pulled open exposing medium breasts, single brown braid with red ribbon, straddling him on bed for a medical checkup, losing composure with tongue out as he thrusts up strongly",
        "boy": "lying on back on bed, gripping her hips and thrusting up",
    },
    "cg_sp05_tsubaki_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed, red camellia flower next to pillow",
        "pose": "missionary on bed, m-legs spread, clumsily tied pajama ribbon undone, vaginal",
        "girl": "partially undressed, pajama top with clumsily tied ribbon completely undone exposing fair medium breasts, hime cut black hair, red camellia flower by pillow, lying on bed with legs spread in m-legs, moaning",
        "boy": "on top of her on bed between her spread legs",
    },
    "cg_sp05_maehyang_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "missionary on bed, pinned down after cowgirl, wrapping both arms and legs tightly around him, vaginal",
        "girl": "nude, long black hair let down with gold hairclip, mole under mouth, curvy body, exposed huge breasts pressed against his chest, lying on bed clinging desperately to him with both arms and legs wrapped around him",
        "boy": "on top of her on bed, penetrating deeply",
    },
    "cg_sp05_seola_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, futon/bed blanket, closed door in background",
        "pose": "missionary under blanket, open folding flower fan held up hiding both their kissing faces toward the door, silent climax, vaginal",
        "girl": "nude under blanket, white plum blossom hairclip, exposed flat chest, mole under eye, holding an open painted flower fan to hide their kissing lips from the door, trembling silently in climax",
        "boy": "on top of her under the blanket, kissing her behind the folding fan",
    },
    "cg_sp05_hwaseon_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "missionary on bed with one leg lifted straight up in a dancer split over his shoulder, gripping bedsheet, vaginal",
        "girl": "nude, colorful flower hairclips in hair, exposed medium breasts, flexible dancer body with one leg stretched straight up onto his shoulder in a full split, gripping bedsheets and moaning",
        "boy": "on top of her on bed, holding her straight lifted leg",
    },
    "cg_sp05_choryeon_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "doggystyle / spooning from behind on bed, burying blushing face in pillow, holding his forearm with both hands, vaginal",
        "girl": "nude, pink lotus hairclip, exposed small breasts, slender body turned away on all fours on bed, burying her bright red face into the pillow while gripping his forearm with both hands, moaning",
        "boy": "kneeling behind her on bed, kissing her neck and earlobe while penetrating from behind",
    },
    "cg_sp05_choa_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "missionary on bed, both her wrists tied together with his wrist in red arrest rope, vaginal",
        "girl": "nude, black hair down, toned body, exposed medium breasts, red arrest rope binding her wrists together with his wrist against the bedsheet, moaning in bound pleasure",
        "boy": "on top of her on bed, one wrist bound together with hers in red rope",
    },
    "cg_sp05_dano_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "reverse sitting on lap on bed, holding open storybook trying to read aloud while penetrated from behind, vaginal",
        "girl": "nude, red ribbon headband, short messy black hair, tan petite body, exposed small breasts, sitting on his lap facing forward holding an open storybook, dropping the book as he thrusts from below",
        "boy": "sitting behind her on bed, holding her waist and thrusting up",
    },
    "cg_sp05_bada_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "missionary on bed, orange haenyeo gourd float (tewak) propped under lower back raising pelvis high, vaginal",
        "girl": "nude, short wavy black hair, toned tan body glistening with sweat, exposed medium breasts, orange tewak float propped under her lower back on the bed lifting her hips high, gasping",
        "boy": "on top of her on bed, gripping her raised pelvis",
    },
    "cg_sp05_garam_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "mating press / legs on shoulders missionary on bed, stiff nervous posture melting into climax, vaginal",
        "girl": "nude, brown single braid with red hair tie, tan skin, exposed medium breasts, lying on back on bed with both legs placed on his shoulders, blushing ears and crying out in climax",
        "boy": "on top of her on bed, holding her legs on his shoulders",
    },
    "cg_sp05_bori_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed, empty dinner tray set aside",
        "pose": "missionary on bed, naked apron, hugging his head to her large breasts as he sucks her nipple, vaginal",
        "girl": "naked apron, wearing only a kitchen apron over her nude curvy body, exposed large breasts, single braid, lying on bed cradling his head against her chest as he nurses at her breast, maternal ecstatic smile",
        "boy": "on top of her on bed, burying his face in her breasts and sucking her nipple",
    },
    "cg_sp05_ellie_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed headboard with three blue sticky notes attached",
        "pose": "missionary on bed under headboard with blue sticky notes, teary blue eyes, legs wrapped around waist, vaginal, cum in pussy",
        "girl": "nude, long wavy blonde hair spread on pillow under headboard with three blue sticky notes, fair skin flushed pink, exposed large breasts, teary blue eyes confessing love, legs around his waist",
        "boy": "on top of her on bed, penetrating deeply",
    },
    "cg_sp05_hanbyeol_h1": {
        "premodern": False,
        "env": "inside blanket tent over bed at night, illuminated by a single small flashlight beam inside the blanket",
        "pose": "missionary inside blanket tent, flashlight beam illuminating their sweaty bodies and dropped memo pad, vaginal",
        "girl": "nude except for round reading glasses, single black braid, exposed medium breasts glistening in flashlight beam under the blanket tent, dropping her memo pad and pen in climax",
        "boy": "on top of her under the blanket tent",
    },
    "cg_sp05_chunmei_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed, wooden abacus on pillow",
        "pose": "cowgirl position on bed, wearing high-slit qipao pajama top, reaching to flick abacus beads by pillow, vaginal",
        "girl": "partially undressed, red satin qipao pajama shirt unbuttoned exposing medium breasts, double buns, straddling and riding him on bed while reaching one hand to flick the wooden abacus beads on the pillow",
        "boy": "lying on back on bed, holding her hips",
    },
    "cg_sp05_saebyeok_h1": {
        "premodern": False,
        "env": "inside modern bedroom at night, bed",
        "pose": "rough missionary / pinned down on bed sheet by neck/hair, gazing up at his unhooded face in tears, vaginal, cum in pussy",
        "girl": "nude, mature curvy body, exposed huge breasts, hair bun undone, pinned down on bed sheet, looking up at his unhooded face with tears streaming down her blushing cheeks, moaning in submissive ecstasy",
        "boy": "hood down, on top of her on bed, pinning her down and penetrating deeply",
    },
    "cg_sp05_bomnae_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "missionary on bed, rubbing her cheek against the newly sewn button on his hoodie while he unbuttons her pajamas, vaginal",
        "girl": "nude, handmade cotton pajamas unbuttoned and spread open around her, white headband, short bob cut, exposed medium breasts, rubbing her blushing cheek affectionately against the front button of his hoodie",
        "boy": "wearing only his black hoodie with hood up and lower body nude, on top of her on bed",
    },
    "cg_sp05_dasom_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "missionary on bed, wrists pinned above head, kissing his lips under his low hood, vaginal",
        "girl": "nude, straight medium black hair with blunt bangs, exposed medium breasts, wrists pinned against the pillow above her head, arching her back in climax",
        "boy": "wearing black hoodie with hood pulled low, on top of her pinning her wrists",
    },
    "cg_sp05_moa_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "cowgirl position on bed, wearing only glowing red devil horn headband, girl on top bouncing rhythmically, vaginal",
        "girl": "nude except for glowing red devil horn headband on her streaked brown gyaru hair, tan body, exposed medium breasts bouncing, straddling and riding him energetically on bed",
        "boy": "lying on back on bed, clapping/gripping her hips",
    },
    "cg_sp05_orpheia_h1": {
        "premodern": False,
        "env": "inside modern music studio bedroom at night, bed",
        "pose": "intimate missionary on bed, half-undressed maid outfit, silver hair spread on sheets, arms around his neck, vaginal",
        "girl": "partially undressed, black and white frilled maid dress pulled open exposing large breasts, green ribbon, very long white hair spread on white bedsheets, arms wrapped around his neck, happy tears in green eyes",
        "boy": "on top of her on the studio bed, embracing her closely",
    },
    # ── Side Story sp06 (출산 후 젖이 도는 밤 36종 — 모유/수유/착유 및 부부 침실) ──
    "cg_sp06_saebyeok_h1": {
        "premodern": False,
        "env": "inside modern bedroom at night, bed, baby crib sleeping quietly in background",
        "pose": "doggystyle on bed, breast grabbing and milking from behind, lactation, breast milk spraying, vaginal, cum in pussy",
        "girl": "nude, mature curvy body, hair bun, exposed huge breasts dripping and spraying white breast milk, lactation, on all fours on bed in doggystyle, crying tears of ecstasy as her breasts are squeezed",
        "boy": "kneeling behind her on bed, reaching around to squeeze her lactating huge breasts while penetrating from behind",
    },
    "cg_sp06_noeul_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "cowgirl position on bed, pressing lactating huge breasts to his mouth for nursing while riding, flattened tiger ears, stiff tiger tail, vaginal",
        "girl": "nude, tiger girl, orange streaked hair, flattened tiger ears, striped tiger tail standing straight up, exposed huge breasts dripping breast milk, lactation, straddling him and pressing her nipple into his mouth",
        "boy": "lying on back on bed, sucking her lactating breast while thrusting up",
    },
    "cg_sp06_ullim_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "mating press / legs lifted high missionary on bed, breast milk droplets scattering like golden light particles, lactation, vaginal, cum in pussy",
        "girl": "nude, gold forehead jewel, gradient green hair, exposed small breasts spraying breast milk droplets like golden ripples, lactation, legs lifted high by him on bed, teary ecstatic face",
        "boy": "on top of her on bed, lifting both her legs and penetrating deeply",
    },
    "cg_sp06_dallae_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "cowgirl position on bed after lactating paizuri, breast milk splashing from medium breasts, girl on top, vaginal",
        "girl": "nude, wooden hairclip in hair bun, exposed medium breasts glistening and splashing with white breast milk, lactation, straddling and riding him vigorously on bed",
        "boy": "lying on back on bed, hands gripping her waist",
    },
    "cg_sp06_naru_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "reverse cowgirl position on bed, girl on top facing away, breast fondling and clitoris rubbing from behind, lactation and squirting, vaginal",
        "girl": "nude, purple braided hair with brass bell, faint blue glow on ankles, exposed large breasts dripping breast milk, lactation, straddling him in reverse cowgirl, arching back and squirting as he fondles her breasts and clitoris from behind",
        "boy": "sitting/lying behind her on bed, fondling her lactating breasts and clitoris",
    },
    "cg_sp06_irang_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "missionary on bed, arms around neck, legs wrapped around waist, nursing/sucking her lactating breast, vaginal",
        "girl": "nude, black hair, exposed medium breasts dripping sweet breast milk, lactation, lying on bed with arms around his neck and legs wrapped around his waist, blushing deeply as he sucks her nipple",
        "boy": "on top of her on bed, sucking her lactating breast while penetrating her",
    },
    "cg_sp06_eunsil_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "spooning sex on side on bed, fingers strumming her nipples and clitoris like gayageum strings from behind, arched back, vaginal",
        "girl": "nude, very long straight black hair, petite body, exposed flat chest, lying on her side on bed, arching her slender back like a bow as his fingers pinch and strum her nipples and clitoris from behind",
        "boy": "lying on his side behind her on bed, playing with her nipples and clitoris while penetrating from behind",
    },
    "cg_sp06_ara_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed, feathered recurve bow hanging on wall above",
        "pose": "mating press / folded legs missionary on bed, both ankles held high lifting hips, sweat-drenched breasts bouncing, vaginal",
        "girl": "nude, high black ponytail, toned tan body drenched in sweat, exposed medium breasts bouncing, lying on bed under the wall-mounted bow with both ankles held high by him, crying out in ecstasy",
        "boy": "on top of her on bed, holding both her ankles high and thrusting deeply",
    },
    "cg_sp06_gaon_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed, calligraphy brush pen on sheet",
        "pose": "doggystyle / from behind on bed, ink writing on lower belly, covering blushing face with both hands while pushing ass back, vaginal",
        "girl": "nude, black hair bun, petite body, exposed small breasts, brush ink marks written on her lower stomach, on all fours on bed covering her blushing face with both hands while pushing her hips back",
        "boy": "kneeling behind her on bed, holding her waist and thrusting from behind",
    },
    "cg_sp06_haerang_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "doggystyle on all fours on bed, burying nose in his black hoodie on pillow to sniff his scent, breast milk dripping on sheets, lactation, vaginal",
        "girl": "nude, brown side ponytail, exposed medium breasts dripping white breast milk onto bedsheets, lactation, on all fours with her face buried in his black hoodie on the pillow, ass raised high, trembling in climax",
        "boy": "kneeling behind her on bed, gripping her hips in doggystyle",
    },
    "cg_sp06_sara_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "cowgirl position on bed, girl on top swirling hips while he sucks her large breast from below, vaginal",
        "girl": "nude, long wavy red hair swirling, tan curvy body, gold earrings, exposed large breasts being sucked by him as she rides on top and rolls her hips",
        "boy": "lying on back on bed, sucking her nipple while thrusting up into her",
    },
    "cg_sp06_haneui_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, tall bed headboard",
        "pose": "standing carrying sex (ekiben) by bed, caught in mid-air after jumping from headboard, legs and arms wrapped around him, squirting, vaginal",
        "girl": "nude, black hair bun with gold hairclip, exposed medium breasts, suspended in his arms with feet off the floor, clinging to his neck and wrapping her legs around his waist, climaxing intensely",
        "boy": "standing by the bed headboard, catching and holding her up while penetrating from below",
    },
    "cg_sp06_maru_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "missionary on bed, both wrists pinned down against white sheets above head, kissing neck, vaginal",
        "girl": "nude, braided black hair bun, exposed medium breasts, both wrists pinned against the bedsheets by his hands, surrendering completely and arching her chest as he kisses her neck",
        "boy": "on top of her on bed, pinning both her wrists to the mattress and penetrating deeply",
    },
    "cg_sp06_seori_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, under warm blanket",
        "pose": "spooning / reverse sitting under blanket, wearing only cute bear-ear hooded fleece pajama top with bottom nude, vaginal",
        "girl": "clothed sex, bottomless, wearing only a cute brown bear-ear hooded fleece pajama top with hood up, lower body nude, exposed small breasts under open top, hugged tightly from behind under the blanket, blushing and panting",
        "boy": "behind her under the blanket, embracing her closely and penetrating from behind",
    },
    "cg_sp06_yeoul_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "missionary on bed, legs wrapped around waist, overflowing cum dripping from pussy after multiple creampies, vaginal, cum in pussy",
        "girl": "nude, brown wavy low twintails with blue hair ties, freckles, exposed medium breasts, lying on back on bed with legs wrapped around his waist, white cum already overflowing from her pussy, blissful ecstatic smile",
        "boy": "on top of her on bed, delivering another deep internal cumshot",
    },
    "cg_sp06_soebyeol_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "missionary on bed, gripping bedsheets with hands wearing iron ring, sweaty toned tan body, vaginal, cum in pussy",
        "girl": "nude, short messy black hair, sweat-drenched toned tan body, exposed large breasts, iron ring on finger gripping the bedsheets tightly, legs spread wide taking his heavy thrusts",
        "boy": "on top of her on bed, thrusting powerfully",
    },
    "cg_sp06_danbi_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, framed family certificate on wall above bed",
        "pose": "standing carrying sex / missionary against wall under family frame, legs locked tightly around his waist, lactation, vaginal, cum in pussy",
        "girl": "nude, petite body, long black hair, mole under eye, exposed flat chest with beads of breast milk, lactation, held up in his arms with legs locked around his waist, moaning loudly without covering her mouth",
        "boy": "standing by the bedroom wall, holding her up and penetrating deeply",
    },
    "cg_sp06_sodam_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "missionary / cowgirl initiation on bed, spreading legs boldly and guiding his penis into her pussy with her own hand, vaginal",
        "girl": "nude, black hair tied with a cute ribbon, petite body, exposed flat chest, spreading her thighs boldly on bed and guiding his penis into herself with her fingers, kissing his lips",
        "boy": "on top of her on bed, kissing her as she guides him inside",
    },
    "cg_sp06_goyo_h1": {
        "premodern": False,
        "env": "inside dark modern bedroom at night, eerie glowing blue ghost fire, white steam rising from skin",
        "pose": "cowgirl position on bed, wearing open white mourning jeogori, lactating pale breasts dripping milk, straddling his stomach, vaginal, cum in pussy",
        "girl": "partially undressed, ghost girl, white sobok jeogori pulled open exposing pale small breasts dripping white breast milk, lactation, absurdly long black hair, straddling him on bed with rising steam and crimson blush",
        "boy": "lying on back on bed beneath her",
    },
    "cg_sp06_dodam_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "missionary on bed, wearing only a medical stethoscope around her neck, stethoscope dangling between breasts, legs spread wide, vaginal",
        "girl": "nude except for a silver medical stethoscope around her neck dangling between her exposed medium breasts, brown single braid with red ribbon, lying on bed with legs spread wide as the patient being examined, moaning",
        "boy": "on top of her on bed, examining/caressing her body while penetrating deeply",
    },
    "cg_sp06_tsubaki_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "face-to-face sitting on lap on bed, wearing open kimono-style nightgown spread to sides, rubbing breasts against his chest, whispering in ear, vaginal",
        "girl": "partially undressed, thin kimono-style nightgown spread open to both sides without underwear, exposed medium breasts pressed and rubbed against his chest, hime cut black hair with red camellia clip, straddling his lap and whispering in his ear",
        "boy": "sitting on bed, hugging her waist closely",
    },
    "cg_sp06_maehyang_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom past midnight, bed, dim warm lamp",
        "pose": "intimate missionary on bed, arms wrapped around his neck, curvy body, vaginal, cum in pussy",
        "girl": "nude, black hair bun coming loose, mole under mouth, curvy body, exposed huge breasts, lying on bed wrapping her arms tightly around his neck and trembling from a deep internal cumshot",
        "boy": "on top of her on bed, embracing her closely",
    },
    "cg_sp06_choryeon_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "missionary on bed, wearing foam earplugs in her ears, moaning loudly with mouth wide open, vaginal",
        "girl": "nude, black hair bun with pink lotus clip, slender body, exposed small breasts, wearing small earplugs in both ears, lying on back on bed under him, moaning loudly without restraint",
        "boy": "on top of her on bed, thrusting deeply",
    },
    "cg_sp06_hwaseon_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "cowgirl position on bed, wearing only his oversized black hoodie with hood pulled up (boyfriend shirt), bottomless with penetration visible under hoodie hem, vaginal",
        "girl": "clothed sex, bottomless, wearing only his oversized black hoodie with the hood pulled up over her flower hairclips, hoodie unzipped/lifted showing medium breasts and explicit vaginal penetration beneath the hem, riding on top of his stomach",
        "boy": "lying on back on bed, holding her hips under the oversized hoodie",
    },
    "cg_sp06_seola_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed, folded white fan resting by pillow",
        "pose": "intimate missionary on bed, clinging tightly and whispering/singing in his ear, legs locked around waist, vaginal, cum in pussy",
        "girl": "nude, long black hair with white plum blossom clip, folded fan set aside by pillow, mole under eye, exposed flat chest, clinging tightly to his neck and whispering in his ear while receiving a creampie",
        "boy": "on top of her on bed, embracing her petite body",
    },
    "cg_sp06_choa_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed headboard",
        "pose": "missionary pressed against bed headboard, wrists bound together with red arrest rope wrapped around his neck, teary eyes, vaginal, cum in pussy",
        "girl": "nude, black hair, exposed medium breasts, both wrists bound together with red arrest rope and looped around his neck, pressed against the bed headboard, crying tears of pleasure",
        "boy": "on top of her against the bed headboard, penetrating deeply",
    },
    "cg_sp06_dano_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed, turned-off streaming microphone on desk nearby",
        "pose": "doggystyle from behind on bed, trying to narrate live commentary while moaning, vaginal",
        "girl": "nude, red ribbon headband, short messy black hair, tan petite body, exposed small breasts, on all fours on bed being penetrated from behind, trying to speak like a storyteller as her voice breaks into moans",
        "boy": "kneeling behind her on bed, gripping her hips",
    },
    "cg_sp06_bada_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night after bath, bed, damp towel nearby",
        "pose": "missionary on bed, wet glistening tan body after bath, deep kiss, legs wrapped around waist, squirting, vaginal",
        "girl": "nude, wet short wavy black hair, toned tan skin glistening with bath water droplets and sweat, exposed medium breasts, wrapping her legs tightly around his waist and kissing him deeply while squirting",
        "boy": "on top of her on bed, kissing her deeply",
    },
    "cg_sp06_garam_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed, antique matchlock musket mounted on wall",
        "pose": "missionary on bed under wall-mounted musket, legs spread, blushing deeply and crying sweet tears from multiple creampies, vaginal, cum in pussy",
        "girl": "nude, brown single braid with red hair tie, tan skin, exposed medium breasts, lying on bed under the antique musket, blushing from ear to ear and crying sweet tears in climax",
        "boy": "on top of her on bed, penetrating deeply",
    },
    "cg_sp06_bori_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "intimate missionary on bed, lactating large breasts spraying sweet breast milk onto his lips and chest, hugging each other, vaginal",
        "girl": "nude, single black braid, curvy body, exposed large breasts overflowing and spraying white breast milk onto his chest and lips, lactation, embracing him warmly in missionary",
        "boy": "on top of her on bed, kissing her milk-wet chest and penetrating deeply",
    },
    "cg_sp06_ellie_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "missionary on bed, blonde hair spread on sheets, curvy figure, pleading in ecstasy, vaginal, cum in pussy",
        "girl": "nude, long wavy blonde hair spread across white bedsheets, fair skin, exposed large breasts, blue eyes hazy with pleasure, legs wrapped around his waist receiving an internal cumshot",
        "boy": "on top of her on bed, thrusting deeply",
    },
    "cg_sp06_hanbyeol_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed, closed laptop and removed round glasses on nightstand",
        "pose": "mating press / legs lifted missionary on bed next to closed laptop, glasses removed, tongue out, arms clinging to his neck, vaginal",
        "girl": "nude, glasses removed and placed on nightstand by closed laptop, single black braid, exposed medium breasts, legs lifted high on bed, clinging to his neck with flushed face and tongue out",
        "boy": "on top of her on bed, lifting her thighs and penetrating deeply",
    },
    "cg_sp06_chunmei_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "missionary on bed, faint flour smudge on cheek, legs locked tightly around his waist, bouncing breasts, vaginal",
        "girl": "nude, double black buns, cute flour smudge on cheek (food on face), exposed medium breasts bouncing, locking her legs tightly around his waist on bed and moaning",
        "boy": "on top of her on bed, holding her waist",
    },
    "cg_sp06_bomnae_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "intimate missionary on bed, both hands interlocked with fingers above her head, teary happy kiss, vaginal, cum in pussy",
        "girl": "nude, short black bob cut, exposed medium breasts, lying on bed with both hands interlocked with his above her head, accepting his kiss with teary smiling eyes while receiving a creampie",
        "boy": "on top of her on bed, interlocking fingers with both her hands and kissing her",
    },
    "cg_sp06_dasom_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed",
        "pose": "close missionary on bed, sharing a pair of wired earphones stretched taut between their ears, passionate kiss, arching back, vaginal",
        "girl": "nude, straight medium black hair with blunt bangs, exposed medium breasts, wearing one side of a white wired earphone shared with him, wire stretched between their necks as they kiss passionately in missionary",
        "boy": "on top of her on bed, wearing the other earphone earpiece and kissing her deeply",
    },
    "cg_sp06_moa_h1": {
        "premodern": False,
        "env": "inside cozy modern bedroom at night, bed, vintage pager (beeper) tossed by pillow",
        "pose": "missionary on bed, clinging with whole sweaty tan body, legs wrapped around waist, vaginal, cum in pussy",
        "girl": "nude, gyaru, streaked brown hair, tan sweat-drenched body, exposed medium breasts, pager lying by pillow, clinging tightly to him with all four limbs on bed during multiple creampies",
        "boy": "on top of her on bed, penetrating deeply",
    },
    "cg_sp06_orpheia_h1": {
        "premodern": False,
        "env": "inside dark modern home music studio bedroom at night, all computer monitors turned off, bed",
        "pose": "missionary on bed, wearing only maid headdress and white garter belt stockings, arms around neck, teary happy smile, vaginal, cum in pussy",
        "girl": "nude except for maid headdress, green hair ribbon, and white garter belt thighhighs, very long white hair spread on bed, exposed large breasts, hugging his neck and seeking his lips with a teary blissful smile",
        "boy": "on top of her on the studio bed, embracing her and delivering a deep creampie",
    },
    "cg_ch14_celeste_h1": {
        "premodern": True,
        "env": "inside 1866 ganghwa oegyujanggak royal archive annex at night, moonlight and orange firelight glow through paper lattice window, crimson silk curtain spread on wooden floor, fallen black lace parasol and uigwe book nearby",
        "pose": "cowgirl position, girl on top, straddling, vaginal, cum in pussy, clothed sex, partially undressed",
        "girl": "partially undressed, french aristocratic gothic black and crimson velvet corset dress unlaced and pulled down, joseon dark silk jangot cloak draped loosely off shoulders, exposed huge breasts, pink nipples, black lace choker with silver cross, black lace gloves, vampire fangs, purple eyes, biting lower lip desperately trying to maintain dignified aristocratic composure while trembling in orgasm from internal cumshot, teary eyes, deep blush",
        "boy": "sitting and leaning back on crimson silk curtain on wooden archive floor, gripping her wide hips and thrusting up deeply",
    },
    "cg_end_celeste_h1": {
        "premodern": True,
        "env": "inside candlelit 1866 ganghwa oegyujanggak royal archive annex at night, flickering candle stand, crimson silk curtain on wooden floor, transcribed uigwe books and folded black lace parasol nearby",
        "pose": "mating press, legs lifted high missionary on silk curtain, clothed sex, biting neck, vaginal, cum in pussy",
        "girl": "partially undressed, french gothic black and crimson velvet corset dress unlaced at front, dark silk jangot cloak spread beneath her, exposed huge breasts, pink nipples, black lace choker with silver cross, vampire fangs lightly biting his neck, purple eyes glistening with dignified tears as she absorbs his life energy, trying to keep her noble pride, legs lifted high over his shoulders",
        "boy": "on top of her on the crimson silk curtain, lifting both her thighs and penetrating deeply",
    },
    "cg_sp05_celeste_h1": {
        "premodern": False,
        "env": "inside dark modern home music studio bedroom at night, blackout curtains, crystal wine glass with red tomato juice on nightstand, bed",
        "pose": "mating press missionary on bed, wrists pinned, biting neck, vaginal, cum in pussy",
        "girl": "partially undressed, sheer black lace nightgown slip with crimson ribbon trim pulled up over chest, exposed huge breasts, pink nipples, vampire fangs lightly biting his neck, purple eyes with tears, blushing pale skin, trying to keep her proud noble composure while trembling from a deep creampie on bed",
        "boy": "on top of her on the bed, pinning her wrists and thrusting deeply",
    },
    "cg_sp06_celeste_h1": {
        "premodern": False,
        "env": "inside dark modern home music studio bedroom at midnight, bed, dim warm lamp",
        "pose": "cowgirl position on bed, girl on top, straddling, upright proud posture, vaginal, cum in pussy",
        "girl": "partially undressed, sheer black lace nightgown slip slipped off shoulders around waist, exposed huge breasts, pink nipples, vampire fangs, biting lip to suppress moans and maintain aristocratic pride while straddling him on bed and receiving an internal cumshot, teary purple eyes, deep blush",
        "boy": "lying on back on bed, gripping her curvy hips and thrusting upward",
    },
}


def sanitize_prompt(text, cast=None):
    """tools/nai-rules.json 설정에 따라 프롬프트에서 금지된 나이·비표준 표현을 제거하고,
    단부루 정식 태그로 치환하며, 인물(cast)의 스리사이즈 기준 5단계 가슴 크기 태그와 loli 태그를 강제 동기화한다."""
    if not text:
        return text
    s = text
    for pat in RULES.get("forbidden_patterns", []):
        s = re.sub(pat + r",?\s*", "", s, flags=re.IGNORECASE)
    for bad, good in RULES.get("tag_replacements", {}).items():
        s = re.sub(r"\b" + re.escape(bad) + r"\b", good, s, flags=re.IGNORECASE)

    cid = cast if isinstance(cast, str) else (cast[0] if isinstance(cast, list) and len(cast) == 1 else None)
    if cid:
        parts = re.split(r"(-?\d+(?:\.\d+)?::[^:]+::)", s)
        if cid in LOLI_SET:
            has_loli = any(re.search(r"\bloli\b", parts[idx], flags=re.IGNORECASE) for idx in range(0, len(parts), 2))
            if not has_loli:
                parts[0] = f"loli, {parts[0]}"
        else:
            for idx in range(0, len(parts), 2):
                parts[idx] = re.sub(r"\bloli\b,?\s*", "", parts[idx], flags=re.IGNORECASE)
        s = "".join(parts)

    if cid and cid in BMAP:
        tier = BMAP[cid]
        parts = re.split(r"(-?\d+(?:\.\d+)?::[^:]+::)", s)
        has_tier = False
        for idx in range(0, len(parts), 2):
            if re.search(r"\b(flat chest|small breasts|medium breasts|large breasts|huge breasts)\b", parts[idx]):
                parts[idx] = re.sub(
                    r"\b(flat chest,?\s*small breasts|flat chest|small breasts|medium breasts|large breasts|huge breasts)\b",
                    tier,
                    parts[idx],
                )
                has_tier = True
        s = "".join(parts)
        if not has_tier:
            s = f"{tier}, {s}"

    s = re.sub(r",\s*,+", ",", s)
    s = re.sub(r"\s+,", ",", s)
    s = re.sub(r",\s+", ", ", s).strip().strip(",").strip()
    return s


def base_char_looks(cid):
    """tools/nai-log.json의 캐릭터 기본 외형(looks)과 가슴 크기 네거티브 가중치를 결합하여 반환한다."""
    entry = LOOKS.get(cid, {})
    base = entry.get("looks", "") if isinstance(entry, dict) else str(entry)
    # 1girl은 base_caption에 들어가므로 char_caption에서는 girl로 정리하거나 유지하되, 반대 체형 억제 태그를 붙인다
    tier = BMAP.get(cid)
    neg_w = TIER_NEG_WEIGHT.get(tier, "")
    parts = [p for p in (base, neg_w) if p]
    return sanitize_prompt(", ".join(parts), cid)


def cast_of(i):
    if i.startswith("cg_muk_") or i == "cg_ep_muk_pages_break":
        return "muk"
    if i == "cg_ep_sayeon_scroll_break":
        return "sayeon"
    m = re.match(r"cg_(?:ch\d+|sp\d+|end|ep|after)_([a-z_]+?)_(?:h\d|d\d|idol_h\d|school_h\d|\w+)$", i)
    c = m.group(1) if m else None
    if c == "saebyeok" and (
        i.startswith("cg_ch23_") or i.startswith("cg_sp03_") or
        i.startswith("cg_sp05_") or i.startswith("cg_sp06_")
    ):
        return "saebyeok_mom"
    return c


# 이미 수작업으로 세밀하게 작성된 에셋(설아 자매 교복/아이돌 애프터스토리 8종, 명월 H씬 1종, 신규 추가 H씬 11종)은 보존
PRESERVE_IDS = {
    "cg_ch19_myeongwol_h1",
    "cg_after_maehyang_idol_h1",
    "cg_after_choryeon_idol_h1",
    "cg_after_hwaseon_idol_h1",
    "cg_after_seola_idol_h1",
    "cg_after_maehyang_school_h1",
    "cg_after_choryeon_school_h1",
    "cg_after_hwaseon_school_h1",
    "cg_after_seola_school_h1",
    "cg_after_bath_harem_h1",
    "cg_after_dodam_clinic_h1",
    "cg_after_seola_pregnant_h1",
    "cg_after_bori_noeul_lactation_h1",
    "cg_after_mother_daughter_3p_h1",
    "cg_end_sayeon_h1",
    "cg_after_orpheia_muk_sayeon_h1",
    "cg_after_ara_gaon_3p_h1",
    "cg_after_maru_seori_3p_h1",
    "cg_after_seola_sisters_4p_h1",
    "cg_sp05_sayeon_h1",
}

items = []
for f in sorted(glob.glob(str(ROOT / "story/*.js"))):
    for mt in re.finditer(r"//\s*\[NAI_NSFW_CG:\s*(\w+)\]\s*(.+)", Path(f).read_text(encoding="utf-8")):
        i, d = mt.group(1), mt.group(2)
        if i in PRESERVE_IDS:
            continue
        c = cast_of(i)
        if c is None or c not in LOOKS:
            raise SystemExit(f"알 수 없는 인물 id: {i} -> {c}")
        seed = zlib.crc32(i.encode()) % 4000000000 + 1

        # 1. 묵·사연 배틀/종장 의상 파손 CG (34종)
        if i.startswith("cg_muk_") or i.startswith("cg_ep_"):
            ms = MUK_SAYEON_SCENES.get(i)
            if not ms:
                raise SystemExit(f"MUK_SAYEON_SCENES 누락: {i}")
            env = ms["env"]
            if "sayeon_cloth" in ms:
                common = f"2girls, nsfw, torn clothes, wardrobe malfunction, battle damage, exposed breasts, nipples, blush, sweat, {env}, no readable text"
                chars = [
                    {
                        "cast": "muk",
                        "prompt": sanitize_prompt(f"{base_char_looks('muk')}, {ms['muk_cloth']}", "muk"),
                        "x": 0.38,
                        "y": 0.55,
                    },
                    {
                        "cast": "sayeon",
                        "prompt": sanitize_prompt(f"{base_char_looks('sayeon')}, {ms['sayeon_cloth']}", "sayeon"),
                        "x": 0.65,
                        "y": 0.5,
                    },
                ]
            elif "sayeon_only" in ms:
                common = f"1girl, solo, nsfw, nude, exposed breasts, nipples, blush, embarrassed, {env}, no readable text"
                chars = [
                    {
                        "cast": "sayeon",
                        "prompt": sanitize_prompt(f"{base_char_looks('sayeon')}, {ms['sayeon_only']}", "sayeon"),
                        "x": 0.5,
                        "y": 0.5,
                    }
                ]
            elif "muk_only" in ms:
                common = f"1girl, solo, nsfw, nude, exposed breasts, nipples, pale skin, glowing light, {env}, no readable text"
                chars = [
                    {
                        "cast": "muk",
                        "prompt": sanitize_prompt(f"{base_char_looks('muk')}, {ms['muk_only']}", "muk"),
                        "x": 0.5,
                        "y": 0.5,
                    }
                ]
            elif i.endswith("_d1"):
                common = f"1girl, solo, nsfw, torn clothes, battle damage, wardrobe malfunction, cleavage, exposed breasts, thighs, blush, {env}, no readable text"
                chars = [
                    {
                        "cast": "muk",
                        "prompt": sanitize_prompt(f"{base_char_looks('muk')}, {ms['muk_cloth']}", "muk"),
                        "x": 0.5,
                        "y": 0.5,
                    }
                ]
            else:
                common = f"1girl, solo, nsfw, completely torn clothes, almost nude, nipples, battle damage, sitting on ground, blush, {env}, no readable text"
                chars = [
                    {
                        "cast": "muk",
                        "prompt": sanitize_prompt(f"{base_char_looks('muk')}, {ms['muk_cloth']}", "muk"),
                        "x": 0.5,
                        "y": 0.55,
                    }
                ]
            items.append({
                "id": i,
                "size": "bg",
                "seed": seed,
                "model": MODEL,
                "prompt": sanitize_prompt(common),
                "chars": chars,
            })
            continue

        # 2. 히로인 + 상철 H씬 CG (160종)
        ov = SCENE_OVERRIDES.get(i)
        if not ov:
            raise SystemExit(f"SCENE_OVERRIDES 누락: {i}")

        is_premodern = ov.get("premodern", False)
        pose_tags = ov["pose"]
        env_tags = ov["env"]
        common = f"sex, hetero, 1girl, 1boy, nsfw, explicit, {pose_tags}, {env_tags}, no readable text"

        girl_prompt = sanitize_prompt(f"{base_char_looks(c)}, blush, sweat, {ov['girl']}", c)
        boy_base = "1boy, faceless male, shaded face"
        if "hood down" not in ov["boy"]:
            boy_base += ", black hoodie, hood pulled low, eyes hidden in hood shadow"
        boy_prompt = sanitize_prompt(f"{boy_base}, {ov['boy']}", "sangcheol")

        entry = {
            "id": i,
            "size": "bg",
            "seed": seed,
            "model": MODEL,
            "prompt": sanitize_prompt(common),
            "chars": [
                {"cast": c, "prompt": girl_prompt, "x": 0.44, "y": 0.5},
                {"cast": "sangcheol", "prompt": boy_prompt, "uc": "visible eyes", "x": 0.56, "y": 0.5},
            ],
        }
        if is_premodern:
            entry["negative"] = PREMODERN_NEG
        items.append(entry)

p = ROOT / "tools/nai-assets.json"
data = json.loads(p.read_text(encoding="utf-8"))
new_by_id = {x["id"]: x for x in items}
updated_items = []
seen = set()
for x in data["items"]:
    if x["id"] in new_by_id:
        updated_items.append(new_by_id[x["id"]])
        seen.add(x["id"])
    else:
        updated_items.append(x)
for x in items:
    if x["id"] not in seen:
        updated_items.append(x)

data["items"] = updated_items
p.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print(f"총 NSFW CG 주문: {len(items)}장 (신규 추가 {len(items) - len(seen)}장, 기존 갱신 {len(seen)}장, 수작업 보존 {len(PRESERVE_IDS)}장)")
