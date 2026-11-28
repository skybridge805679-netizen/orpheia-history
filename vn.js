'use strict';
// 이야기 엔진: 타이틀, 대본 실행, 세이브·로드, 로그, 오토·스킵.
// 오르페이아(Orphiey) 철도 ADV의 vn.js를 한국사 학습용으로 옮겼다. 대본 문법은 같다.
// 각 장은 story/*.js 에서 VN.chapter(id, 제목, 부제, 대본)으로 등록한다.
// 대본에서 기출을 부르는 명령: @quiz 80-15 80-37  /  @quiz era=고려 n=3  (quiz.js)
const VN=(()=>{
const META_KEY='orpheia-history-vn-v1',LOG_MAX=300;
let meta={saves:{},read:{},flags:{},settings:{auto:1600}};
try{const raw=JSON.parse(localStorage.getItem(META_KEY)||'null');if(raw&&typeof raw==='object')meta={...meta,...raw,settings:{...meta.settings,...raw.settings}};}catch{}
const persist=()=>{try{localStorage.setItem(META_KEY,JSON.stringify(meta));}catch{toast('이 브라우저에서는 세이브가 제한됩니다.');}};

// ── 등장인물. 스탠딩은 NovelAI로 새로 만든 st_* 그림(tools/nai-assets.json).
const CAST={
 orpheia:{name:'오르페이아',cls:'c-orpheia',stand:{neutral:'st_orpheia_neutral',smile:'st_orpheia_smile',excited:'st_orpheia_excited',worry:'st_orpheia_worry',explain:'st_orpheia_explain',surprised:'st_orpheia_surprised',pout:'st_orpheia_pout',shy:'st_orpheia_shy',serious:'st_orpheia_serious',teary:'st_orpheia_teary'},
  face:{neutral:'neutral',smile:'smile',excited:'smile',worry:'worry',explain:'serious',surprised:'serious',pout:'worry',shy:'relief',serious:'serious',teary:'worry'}},
 sayeon:{name:'사연',cls:'c-sayeon',stand:{teary:'st_sayeon_worry',neutral:'st_sayeon_neutral',smile:'st_sayeon_smile',serious:'st_sayeon_serious',surprised:'st_sayeon_surprised',worry:'st_sayeon_worry',writing:'st_sayeon_writing',neolithic:'st_sayeon_neolithic',buyeo:'st_sayeon_buyeo',baekje:'st_sayeon_baekje',hwarang:'st_sayeon_hwarang',goryeo:'st_sayeon_goryeo',joseon:'st_sayeon_joseon'}},
 muk:{name:'묵',cls:'c-muk',stand:{neutral:'st_muk_neutral',smirk:'st_muk_smirk',angry:'st_muk_angry',surprised:'st_muk_surprised',lonely:'st_muk_lonely',smile:'st_muk_smile'}},
 nuri:{name:'누리',cls:'c-other',stand:{paleo:'st_nuri_paleo',neo:'st_nuri_neo',bronze:'st_nuri_bronze'}},
 dallae:{name:'달래',cls:'c-other',stand:{serious:'st_dallae_worry',pregnant:'st_dallae_pregnant',neutral:'st_dallae_smile',smile:'st_dallae_smile',worry:'st_dallae_worry',shy:'st_dallae_shy',angry:'st_dallae_angry',teary:'st_dallae_teary',surprised:'st_dallae_surprised'}},
 noeul:{name:'노을',cls:'c-other',stand:{tiger:'st_noeul_tiger',pregnant:'st_noeul_pregnant',neutral:'st_noeul_smile',smile:'st_noeul_smile',shy:'st_noeul_shy',surprised:'st_noeul_surprised',angry:'st_noeul_angry',teary:'st_noeul_teary',worry:'st_noeul_teary',pout:'st_noeul_pout',serious:'st_noeul_serious'}},   // 노을 = 범에서 늦게 사람이 된 여자(특별한 히로인, 2026.11 주인님 지정)
 ullim:{name:'울림',cls:'c-other',stand:{pregnant:'st_ullim_pregnant',neutral:'st_ullim_smile',smile:'st_ullim_smile',excited:'st_ullim_smile',shy:'st_ullim_shy',surprised:'st_ullim_surprised',angry:'st_ullim_angry',pout:'st_ullim_angry',teary:'st_ullim_teary',worry:'st_ullim_teary',serious:'st_ullim_serious'}},   // 울림 = 종에 새겨진 비천(특별한 히로인, 2026.11 주인님 지정), 종소리나 흥얼거림이 이어지는 동안만 사람 곁에 있다
 garam:{name:'가람',cls:'c-other',stand:{pregnant:'st_garam_pregnant',neutral:'st_garam_smile',smile:'st_garam_smile',excited:'st_garam_smile',shy:'st_garam_shy',surprised:'st_garam_surprised',angry:'st_garam_angry',pout:'st_garam_angry',teary:'st_garam_teary',worry:'st_garam_serious',serious:'st_garam_serious'}},   // 가람 = 강화 산포수 집안의 딸(14장, 2026.11 소담 부담을 덜려고 추가)
 irang:{name:'이랑',cls:'c-other',stand:{pregnant:'st_irang_pregnant',neutral:'st_irang_smile',smile:'st_irang_smile',excited:'st_irang_smile',shy:'st_irang_shy',surprised:'st_irang_surprised',angry:'st_irang_angry',pout:'st_irang_pout',teary:'st_irang_teary',worry:'st_irang_worry',serious:'st_irang_serious'}},   // 신라의 남장한 화랑 지망생(3장), 2026.11 「없던 속성」 추가
 eunsil:{name:'은실',cls:'c-other',stand:{pregnant:'st_eunsil_pregnant',neutral:'st_eunsil_smile',smile:'st_eunsil_smile',excited:'st_eunsil_smile',shy:'st_eunsil_shy',surprised:'st_eunsil_surprised',angry:'st_eunsil_angry',pout:'st_eunsil_pout',teary:'st_eunsil_teary',worry:'st_eunsil_worry',serious:'st_eunsil_serious'}},   // 대가야의 가야금 타는 처녀(3장), 2026.11 「없던 속성」 추가
 sara:{name:'사라',cls:'c-other',stand:{pregnant:'st_sara_pregnant',neutral:'st_sara_smile',smile:'st_sara_smile',excited:'st_sara_smile',shy:'st_sara_shy',surprised:'st_sara_surprised',angry:'st_sara_angry',pout:'st_sara_pout',teary:'st_sara_teary',worry:'st_sara_worry',serious:'st_sara_serious'}},   // 울산항 서역 상인의 딸(6장), 2026.11 「없던 속성」 추가
 choa:{name:'초아',cls:'c-other',stand:{pregnant:'st_choa_pregnant',neutral:'st_choa_smile',smile:'st_choa_smile',excited:'st_choa_smile',shy:'st_choa_shy',surprised:'st_choa_surprised',angry:'st_choa_angry',pout:'st_choa_pout',teary:'st_choa_teary',worry:'st_choa_worry',serious:'st_choa_serious'}},   // 포도청 다모(12장), 2026.11 「없던 속성」 추가
 bada:{name:'바다',cls:'c-other',stand:{pregnant:'st_bada_pregnant',neutral:'st_bada_smile',smile:'st_bada_smile',excited:'st_bada_smile',shy:'st_bada_shy',surprised:'st_bada_surprised',angry:'st_bada_angry',pout:'st_bada_pout',teary:'st_bada_teary',worry:'st_bada_worry',serious:'st_bada_serious'}},   // 제주 해녀(13장), 2026.11 「없던 속성」 추가
 ellie:{name:'엘리',cls:'c-other',stand:{pregnant:'st_ellie_pregnant',neutral:'st_ellie_smile',smile:'st_ellie_smile',excited:'st_ellie_smile',shy:'st_ellie_shy',surprised:'st_ellie_surprised',angry:'st_ellie_angry',pout:'st_ellie_pout',teary:'st_ellie_teary',worry:'st_ellie_worry',serious:'st_ellie_serious'}},   // 정동 선교사의 딸(15장), 2026.11 「없던 속성」 추가
 goyo:{name:'고요',cls:'c-other',stand:{pregnant:'st_goyo_pregnant',neutral:'st_goyo_smile',smile:'st_goyo_smile',excited:'st_goyo_smile',shy:'st_goyo_shy',surprised:'st_goyo_surprised',angry:'st_goyo_angry',pout:'st_goyo_pout',teary:'st_goyo_teary',worry:'st_goyo_worry',serious:'st_goyo_serious'}},   // 경복궁의 처녀귀신(10·14·15장, 특별한 히로인), 2026.11 「없던 속성」 추가
 moa:{name:'모아',cls:'c-other',stand:{pregnant:'st_moa_pregnant',neutral:'st_moa_smile',smile:'st_moa_smile',excited:'st_moa_smile',shy:'st_moa_shy',surprised:'st_moa_surprised',angry:'st_moa_angry',pout:'st_moa_pout',teary:'st_moa_teary',worry:'st_moa_worry',serious:'st_moa_serious'}},   // X세대 갸루(23장), 2026.11 「없던 속성」 추가
 tsubaki:{name:'츠바키',cls:'c-other',stand:{pregnant:'st_tsubaki_pregnant',neutral:'st_tsubaki_smile',smile:'st_tsubaki_smile',excited:'st_tsubaki_smile',shy:'st_tsubaki_shy',surprised:'st_tsubaki_surprised',angry:'st_tsubaki_angry',pout:'st_tsubaki_pout',teary:'st_tsubaki_teary',worry:'st_tsubaki_worry',serious:'st_tsubaki_serious'}},   // 쓰시마 통역 집안의 딸(11장 1609 부산 왜관), 2026.11 「바다 건너 이웃」 추가
 chunmei:{name:'춘메이',cls:'c-other',stand:{pregnant:'st_chunmei_pregnant',neutral:'st_chunmei_smile',smile:'st_chunmei_smile',excited:'st_chunmei_smile',shy:'st_chunmei_shy',surprised:'st_chunmei_surprised',angry:'st_chunmei_angry',pout:'st_chunmei_pout',teary:'st_chunmei_teary',worry:'st_chunmei_worry',serious:'st_chunmei_serious'}},   // 상하이 만둣가게 딸(17장 1919·20장 1932), 2026.11 「바다 건너 이웃」 추가
 celeste:{name:'셀레스트',cls:'c-other',stand:{pregnant:'st_celeste_pregnant',neutral:'st_celeste_smile',smile:'st_celeste_smile',excited:'st_celeste_smile',shy:'st_celeste_shy',surprised:'st_celeste_surprised',angry:'st_celeste_angry',pout:'st_celeste_pout',teary:'st_celeste_teary',worry:'st_celeste_worry',serious:'st_celeste_serious'}},   // 프랑스 귀족 출신 조선 흡혈귀(14장 1866 강화 외규장각, 조선 이름 야화)
 naru:{name:'나루',cls:'c-other',stand:{pregnant:'st_naru_pregnant',neutral:'st_naru_smile',smile:'st_naru_smile',shy:'st_naru_shy',surprised:'st_naru_surprised',angry:'st_naru_angry',teary:'st_naru_teary',serious:'st_naru_serious',worry:'st_naru_serious',pout:'st_naru_pout',baekje:'st_naru_smile',goguryeo:'st_naru_smile',silla:'st_naru_smile',sea:'st_naru_smile',joseon:'st_naru_smile'}},   // 나루 = 건넘의 신령(2026.11 주인님 지정), 시대가 바뀌어도 같은 옷
 ungnyeo:{name:'웅녀',cls:'c-other',stand:{neutral:'st_ungnyeo_neutral',smile:'st_ungnyeo_smile',worry:'st_ungnyeo_worry',teary:'st_ungnyeo_teary',angry:'st_ungnyeo_angry',surprised:'st_ungnyeo_surprised'}},   // 노을의 곰 언니(등장인물)
 hyejin:{name:'혜진',cls:'c-other',stand:{neutral:'st_hyejin_neutral',smile:'st_hyejin_smile',surprised:'st_hyejin_surprised',serious:'st_hyejin_serious',angry:'st_hyejin_angry',pout:'st_hyejin_pout',shy:'st_hyejin_d2',d1:'st_hyejin_d1',d2:'st_hyejin_d2',d3:'st_hyejin_d3'}},   // 외전 「열일곱 무당의 야간 근무」 & 떡볶이 퇴마 찢어짐 스탠딩(d1~3)
 myeongwol:{name:'명월',cls:'c-other',stand:{neutral:'st_myeongwol_neutral',smile:'st_myeongwol_smile',surprised:'st_myeongwol_surprised',serious:'st_myeongwol_serious',angry:'st_myeongwol_angry',pout:'st_myeongwol_pout',shy:'st_myeongwol_shy',pregnant:'st_myeongwol_pregnant'}},   // 19장 경성 인왕산 애기무당(혜진의 고조할머니, 상철의 아이를 임신하고 시대에 남음)
 yunseul:{name:'윤슬',cls:'c-yunseul',stand:{neutral:'st_yunseul_neutral',smile:'st_yunseul_smile',surprised:'st_yunseul_surprised',pout:'st_yunseul_pout',serious:'st_yunseul_serious',shy:'st_yunseul_shy',angry:'st_yunseul_angry',teary:'st_yunseul_teary'}},
 haerang:{name:'해랑',cls:'c-other',stand:{pregnant:'st_haerang_pregnant',neutral:'st_haerang_smile',smile:'st_haerang_smile',serious:'st_haerang_serious',worry:'st_haerang_serious',shy:'st_haerang_shy',angry:'st_haerang_angry',teary:'st_haerang_teary',surprised:'st_haerang_surprised'}},
 ara:{name:'아라',cls:'c-other',stand:{pregnant:'st_ara_pregnant',neutral:'st_ara_smile',smile:'st_ara_smile',excited:'st_ara_smile',surprised:'st_ara_surprised',worry:'st_ara_serious',shy:'st_ara_shy',pout:'st_ara_pout',serious:'st_ara_serious',angry:'st_ara_angry',teary:'st_ara_teary'}},   // 4장 고구려 여궁수
 gaon:{name:'가온',cls:'c-other',stand:{pregnant:'st_gaon_pregnant',neutral:'st_gaon_smile',smile:'st_gaon_smile',excited:'st_gaon_smile',surprised:'st_gaon_surprised',worry:'st_gaon_worry',shy:'st_gaon_shy',pout:'st_gaon_angry',serious:'st_gaon_serious',angry:'st_gaon_angry',teary:'st_gaon_teary'}},   // 4장 김춘추 사절단 통역
 maru:{name:'마루',cls:'c-other',stand:{pregnant:'st_maru_pregnant',neutral:'st_maru_smile',smile:'st_maru_smile',excited:'st_maru_smile',surprised:'st_maru_surprised',worry:'st_maru_serious',shy:'st_maru_shy',pout:'st_maru_angry',serious:'st_maru_serious',angry:'st_maru_angry',teary:'st_maru_teary'}},   // 7장 호족 집안 맏딸
 seori:{name:'서리',cls:'c-other',stand:{pregnant:'st_seori_pregnant',neutral:'st_seori_smile',smile:'st_seori_smile',excited:'st_seori_smile',surprised:'st_seori_surprised',worry:'st_seori_serious',shy:'st_seori_shy',pout:'st_seori_angry',serious:'st_seori_serious',angry:'st_seori_angry',teary:'st_seori_teary'}},   // 7장 서경·북쪽 국경
 soebyeol:{name:'쇠별',cls:'c-other',stand:{pregnant:'st_soebyeol_pregnant',neutral:'st_soebyeol_smile',smile:'st_soebyeol_smile',excited:'st_soebyeol_smile',surprised:'st_soebyeol_surprised',worry:'st_soebyeol_serious',shy:'st_soebyeol_shy',pout:'st_soebyeol_angry',serious:'st_soebyeol_serious',angry:'st_soebyeol_angry',teary:'st_soebyeol_teary'}},   // 9장 다인철소 대장장이 딸
 danbi:{name:'단비',cls:'c-other',stand:{pregnant:'st_danbi_pregnant',neutral:'st_danbi_smile',smile:'st_danbi_smile',excited:'st_danbi_smile',surprised:'st_danbi_surprised',worry:'st_danbi_serious',shy:'st_danbi_shy',pout:'st_danbi_angry',serious:'st_danbi_serious',angry:'st_danbi_angry',teary:'st_danbi_teary'}},   // 9장 공녀 위기의 처녀
 bomnae:{name:'봄내',cls:'c-other',stand:{pregnant:'st_bomnae_pregnant',neutral:'st_bomnae_smile',smile:'st_bomnae_smile',excited:'st_bomnae_smile',surprised:'st_bomnae_surprised',worry:'st_bomnae_serious',shy:'st_bomnae_shy',pout:'st_bomnae_angry',serious:'st_bomnae_serious',angry:'st_bomnae_angry',teary:'st_bomnae_teary'}},   // 22장 YH 무역 봉제 공장 여공
 haneui:{name:'하늬',cls:'c-other',stand:{pregnant:'st_haneui_pregnant',neutral:'st_haneui_smile',smile:'st_haneui_smile',excited:'st_haneui_smile',surprised:'st_haneui_surprised',worry:'st_haneui_teary',shy:'st_haneui_shy',pout:'st_haneui_pout',serious:'st_haneui_serious',angry:'st_haneui_pout',teary:'st_haneui_teary'}},   // 6장 진골 아가씨
 dodam:{name:'도담',cls:'c-other',stand:{pregnant:'st_dodam_pregnant',neutral:'st_dodam_smile',smile:'st_dodam_smile',excited:'st_dodam_smile',surprised:'st_dodam_surprised',worry:'st_dodam_serious',shy:'st_dodam_shy',pout:'st_dodam_pout',serious:'st_dodam_serious',angry:'st_dodam_pout',teary:'st_dodam_teary'}},   // 11장 진주 의원
 yeoul:{name:'여울',cls:'c-other',stand:{excited:'st_yeoul_smile',pregnant:'st_yeoul_pregnant',neutral:'st_yeoul_smile',smile:'st_yeoul_smile',surprised:'st_yeoul_surprised',worry:'st_yeoul_worry',shy:'st_yeoul_shy',angry:'st_yeoul_angry',teary:'st_yeoul_teary'}},
 sodam:{name:'소담',cls:'c-other',stand:{serious:'st_sodam_serious',pregnant:'st_sodam_pregnant',neutral:'st_sodam_smile',smile:'st_sodam_smile',worry:'st_sodam_worry',surprised:'st_sodam_surprised',shy:'st_sodam_shy',angry:'st_sodam_angry',teary:'st_sodam_teary'}},
 maehyang:{name:'매향',cls:'c-other',stand:{pregnant:'st_maehyang_pregnant',neutral:'st_maehyang_smile',smile:'st_maehyang_smile',excited:'st_maehyang_smile',serious:'st_maehyang_smile',shy:'st_maehyang_shy',surprised:'st_maehyang_surprised',angry:'st_maehyang_angry',pout:'st_maehyang_angry',teary:'st_maehyang_teary',worry:'st_maehyang_worry'}},
 choryeon:{name:'초련',cls:'c-other',stand:{pregnant:'st_choryeon_pregnant',neutral:'st_choryeon_smile',smile:'st_choryeon_smile',excited:'st_choryeon_smile',serious:'st_choryeon_smile',shy:'st_choryeon_shy',surprised:'st_choryeon_surprised',angry:'st_choryeon_angry',pout:'st_choryeon_angry',teary:'st_choryeon_teary',worry:'st_choryeon_worry'}},
 hwaseon:{name:'화선',cls:'c-other',stand:{pregnant:'st_hwaseon_pregnant',neutral:'st_hwaseon_smile',smile:'st_hwaseon_smile',excited:'st_hwaseon_smile',serious:'st_hwaseon_smile',shy:'st_hwaseon_shy',surprised:'st_hwaseon_surprised',angry:'st_hwaseon_angry',pout:'st_hwaseon_angry',teary:'st_hwaseon_teary',worry:'st_hwaseon_worry'}},
 seola:{name:'설아',cls:'c-other',stand:{pregnant:'st_seola_pregnant',neutral:'st_seola_smile',smile:'st_seola_smile',serious:'st_seola_serious',shy:'st_seola_shy',surprised:'st_seola_surprised',angry:'st_seola_angry',pout:'st_seola_angry',teary:'st_seola_teary',worry:'st_seola_worry',excited:'st_seola_smile'}},
 dano:{name:'단오',cls:'c-other',stand:{pregnant:'st_dano_pregnant',neutral:'st_dano_smile',smile:'st_dano_smile',surprised:'st_dano_surprised',worry:'st_dano_surprised',shy:'st_dano_shy',angry:'st_dano_angry',teary:'st_dano_teary'}},
 bori:{name:'보리',cls:'c-other',stand:{pout:'st_bori_angry',pregnant:'st_bori_pregnant',neutral:'st_bori_smile',smile:'st_bori_smile',serious:'st_bori_serious',worry:'st_bori_serious',teary:'st_bori_teary',shy:'st_bori_shy',angry:'st_bori_angry',surprised:'st_bori_surprised'}},
 hanbyeol:{name:'한별',cls:'c-other',stand:{pout:'st_hanbyeol_angry',pregnant:'st_hanbyeol_pregnant',neutral:'st_hanbyeol_smile',smile:'st_hanbyeol_smile',excited:'st_hanbyeol_smile',serious:'st_hanbyeol_serious',worry:'st_hanbyeol_worry',surprised:'st_hanbyeol_surprised',teary:'st_hanbyeol_teary',shy:'st_hanbyeol_shy',angry:'st_hanbyeol_angry'}},
 saebyeok:{name:'새벽',cls:'c-other',stand:{neutral:'st_saebyeok_smile',smile:'st_saebyeok_smile',serious:'st_saebyeok_serious',teary:'st_saebyeok_teary',worry:'st_saebyeok_serious',surprised:'st_saebyeok_surprised',shy:'st_saebyeok_shy',angry:'st_saebyeok_angry'}},
 dasom:{name:'다솜',cls:'c-other',stand:{pregnant:'st_dasom_pregnant',neutral:'st_dasom_smile',smile:'st_dasom_smile',serious:'st_dasom_serious',teary:'st_dasom_teary',worry:'st_dasom_serious',surprised:'st_dasom_surprised',shy:'st_dasom_shy',angry:'st_dasom_angry'}},
 me:{name:'상철',cls:'c-player',stand:{}},
};
// 모브: 검은 실루엣(assets/mob_*.webp). 대사 이름표가 아래 이름이면 그 실루엣이 자동으로 선다. 장마다 @mob 이름=원형 으로 덮어쓴다.
const MOB_TYPES=['soldier_ancient','official_ancient','king_ancient','scholar','farmer','blacksmith','merchant','elder_man','woman_elder','woman','court_lady','noble_joseon','soldier_joseon','soldier_modern','man_modern','crowd','child'];
for(const m of MOB_TYPES)CAST['mob_'+m]={name:'',cls:'c-mob',stand:{neutral:'mob_'+m}};
const MOB_BY_NAME={'목수':'blacksmith','해설사':'woman','미군 통역':'man_modern','부여 사람':'farmer','시녀':'court_lady','원광':'scholar','화공':'scholar','노인':'elder_man','모아 엄마':'woman_elder','모아 아빠':'elder_man','모아 남동생':'man_modern','방송국 스태프':'man_modern','촌사람':'farmer','손자':'child','와공':'blacksmith','유생':'scholar','격군':'soldier_joseon','피란민':'woman_elder','신문 배달 소년':'child','해산 군인':'soldier_modern','국밥집 주인':'woman','소금 장수':'elder_man','도고 상인':'merchant','의주 상인':'merchant','여각 주인':'elder_man','전령':'soldier_ancient','젊은 병사':'soldier_ancient','석공':'farmer','귀족':'official_ancient','집사':'scholar','스님':'none','관리':'official_ancient','병사':'soldier_ancient','신라 수군':'soldier_ancient','김춘추':'official_ancient','늙은 병사':'soldier_ancient','늙은 도방 병사':'soldier_ancient','고구려 병사':'soldier_ancient','백제 병사':'soldier_ancient','감독관':'soldier_ancient',
 '태학 박사':'official_ancient','백제 관리':'official_ancient','고구려 관리':'official_ancient','귀족':'official_ancient','사신':'official_ancient','신라 사신':'official_ancient','시험관':'official_ancient','준왕':'king_ancient',
 '선비':'scholar','고흥':'scholar','젊은 관리':'scholar','문벌 도령':'scholar','승객':'scholar','응시생들':'crowd',
 '농부':'farmer','농민':'farmer','만적':'farmer','대장장이':'blacksmith','송나라 상인':'merchant','강 행수':'merchant','다점 주인':'merchant',
 '늙은 내관':'elder_man','이야기꾼':'woman_elder','부여 가':'official_ancient','동예 사람':'farmer','신지의 부하':'soldier_ancient','천군':'elder_man','아낙':'woman','제사장':'elder_man','파수꾼':'soldier_ancient','상궁':'court_lady','대감':'noble_joseon','군관':'soldier_joseon','교관':'soldier_modern',
 '구경꾼':'crowd','아이들':'crowd','절 아이':'child','역부':'farmer','기와장이':'farmer','최치원':'scholar','화랑':'soldier_ancient','왕':'king_ancient','호족':'official_ancient','청년':'scholar','서경 사람':'farmer','이성계':'soldier_ancient','최영':'soldier_ancient','장인':'blacksmith','역관':'scholar','상인':'merchant','점원':'man_modern','발해 수군':'soldier_ancient','무덤지기':'elder_man','당 상인':'merchant','당 관리':'official_ancient','중년 남자':'man_modern','소손녕':'soldier_ancient','서희':'official_ancient','학생':'man_modern','의병':'soldier_joseon','기자':'man_modern'};
const ALIAS={'셀레스트':'celeste','야화':'celeste','웅녀':'ungnyeo','츠바키':'tsubaki','춘메이':'chunmei','이랑':'irang','은실':'eunsil','사라':'sara','초아':'choa','바다':'bada','엘리':'ellie','고요':'goyo','모아':'moa','울림':'ullim','봄내':'bomnae','쇠별':'soebyeol','단비':'danbi','마루':'maru','서리':'seori','아라':'ara','가온':'gaon','도담':'dodam','하늬':'haneui','혜진':'hyejin','명월':'myeongwol','설아':'seola','매향':'maehyang','초련':'choryeon','화선':'hwaseon','다솜':'dasom','새벽':'saebyeok','한별':'hanbyeol','보리':'bori','단오':'dano','소담':'sodam','여울':'yeoul','해랑':'haerang','오르페이아':'orpheia','사연':'sayeon','묵':'muk','윤슬':'yunseul','누리':'nuri','나루':'naru','달래':'dallae','노을':'noeul','가람':'garam','나':'me','주인님':'me','상철':'me'};
const EXPR_FX={surprised:'shake',excited:'hop',smile:'hop',shy:'hop',pout:'tilt',worry:'sink',stern:'nod'};
const OLD={};
const MISSING=new Set();
// 엔딩 수: 대본의 @ending 제목 가짓수를 센다(오르페이아·히로인 34·묵·낙방·히든 하렘 = 38). 엔딩을 늘려도 따로 고칠 필요 없다.
const endingCount=()=>new Set(chapters.flatMap(c=>c.ops.filter(o=>o.t==='ending').map(o=>String(o.arg).split('|')[0].trim()))).size;
// 배틀 뒤의 묵: 찢어진 단계(S.mukDmg 1~3)에 맞는 스탠딩. 그 장이 끝나면 먹물이 다시 차올라 원래 옷으로 돌아온다.
const MUK_DMG={1:{angry:'angry',lonely:'lonely',surprised:'surprised',smile:'smile',smirk:'angry',neutral:'angry'},
 2:{angry:'angry',lonely:'lonely',surprised:'shy',smile:'shy',smirk:'angry',neutral:'shy',shy:'shy'},
 3:{lonely:'lonely',angry:'shy',surprised:'shy',smile:'shy',smirk:'shy',neutral:'shy',shy:'shy'}};
// 한복 오르페이아: 다이브(MV 장면 엔진) 안의 옛 시대 장면에서는 옷도 시대에 맞춘다. @outfit hanbok|maid|auto 로 덮어쓰기.
const HANBOK_EXPR=new Set(['neutral','smile','worry','explain','surprised','pout','shy','excited','serious','teary']);
const HANBOK_CH=new Set(['ch02','ch03','ch04','ch05','ch06','ch07','ch08','ch09','ch10','ch11','ch12','ch13','ch14','ch15']);
function orpHanbok(){if(!S)return false;if(S.outfit==='hanbok')return true;if(S.outfit==='maid')return false;return HANBOK_CH.has(S.ch)&&/(^|\/)bg_era_/.test(String(S.bg||''));}
const ORP_GLITCH={shy:'shy',teary:'shy',worry:'shy',surprised:'shy',pout:'pout',serious:'pout',angry:'pout'};
// 옷을 바꿔 그린 인물: @show의 옷을 기억하고, 표정 그림은 옷별로(st_<id>_<옷>_<표정>). 검수를 통과한 표정만 COSTUME_EXPR에 넣는다.
const COSTUME={saebyeok:new Set(['mom','home'])};   // saebyeok mom = 다솜 엄마가 된 새벽(히든 엔딩)
// 집옷(home): 현대 실내 장면에서 히로인이 입는 옷(2026.11 주인님 지정, 히로인마다 다른 옷). @show <id> home. 표정은 HOME_EXPR만 따로 그렸다.
const HOME_IDS='noeul ullim dallae naru ara gaon haerang haneui maru seori yeoul soebyeol danbi sodam dodam maehyang choryeon hwaseon seola dano garam bori hanbyeol saebyeok bomnae dasom irang eunsil sara choa bada ellie goyo moa tsubaki chunmei celeste'.split(' ');
HOME_IDS.forEach(id=>{(COSTUME[id]||(COSTUME[id]=new Set())).add('home');});
COSTUME.moa.add('school');   // 모아 교복(종장 후일담 「모아네 집」, st_moa_school)
COSTUME.maehyang.add('school');COSTUME.maehyang.add('idol');COSTUME.choryeon.add('school');COSTUME.choryeon.add('idol');COSTUME.hwaseon.add('school');COSTUME.hwaseon.add('idol');COSTUME.seola.add('school');COSTUME.seola.add('idol');   // 교방 네 자매 교복·아이돌 무대 의상(종장 후일담)
const HOME_EXPR=new Set(['shy']);   // 임신 중 집옷: @show <id> home+pregnant → st_<id>_home_pregnant(2026.11 주인님 지정)
const COSTUME_EXPR={saebyeok:new Set(['smile','surprised','serious','shy','angry','teary','pregnant','despair','wet'])};   // 검수 뒤 예: ['smile','shy','surprised','angry','teary']
// 사관의 시험 뒤 풀린 사관복 스탠딩(st_sayeon_{shy,surprised}_d1~3). 그림 검수 뒤 true.
const SAYEON_DMG_OK=true;
// 같은 자리에 두 사람이 겹쳐 서지 않게 한다. keep(방금 @show 한 사람)은 그 자리를 지키고, 겹친 사람은 원래 자리(home)가 비었으면 거기로, 아니면 빈자리로 옮긴다.
// 모브에 밀려 자리를 옮긴 인물은 그 자리가 다시 비면 원래 자리로 돌아간다.
function fixSlots(keep){
 const P=['center','left','right'],ids=Object.keys(S.chars);
 const used=()=>new Set(Object.values(S.chars).map(c=>c.pos));
 for(const k of ids){const c=S.chars[k];if(!c||!c.home||c.home===c.pos)continue;if(!Object.keys(S.chars).some(o=>o!==k&&S.chars[o].pos===c.home))c.pos=c.home;}
 for(const k of ids){const c=S.chars[k];if(!c||k===keep)continue;
  const clash=Object.keys(S.chars).find(o=>o!==k&&S.chars[o].pos===c.pos&&(o===keep||ids.indexOf(o)<ids.indexOf(k)));
  if(!clash)continue;
  if(c.auto){delete S.chars[k];continue;}
  const u=used();const free=[c.home,...P].find(p=>p&&!u.has(p));if(free)c.pos=free;}
}
const standFile=(who,expr)=>{const s=CAST[who]?.stand;if(!s)return '';
 if(COSTUME[who]){const c=S?.chars?.[who]?.costume;if(c==='home'&&expr==='pregnant')return `st_${who}_home_pregnant.webp`;if(c==='home')return HOME_EXPR.has(expr)?`st_${who}_home_${expr}.webp`:`st_${who}_home.webp`;if(c&&c!=='home'&&COSTUME_EXPR[who]?.has(expr))return `st_${who}_${c}_${expr}.webp`;if(c&&c!=='home'&&(expr===c||!COSTUME[who].has(expr)))return `st_${who}_${c}.webp`;}
 if(who==='sayeon'&&S?.sayeonDmg&&SAYEON_DMG_OK)return `st_sayeon_${expr==='surprised'?'surprised':'shy'}_d${S.sayeonDmg}.webp`;
 if(who==='orpheia'&&S?.orpDmg)return `st_orpheia_${ORP_GLITCH[expr]||'smile'}_g${S.orpDmg}.webp`;
 if(who==='orpheia'&&orpHanbok())return `st_orpheia_hanbok_${HANBOK_EXPR.has(expr)?expr:'neutral'}.webp`;
 if(who==='muk'&&S?.mukDmg){const d=S.mukDmg,k=S.mukSkin;if(k&&window.MUK_SKINS?.[k]?.dmg)return `st_muk_${k}_${expr==='lonely'?'lonely':d===1?'angry':'shy'}_d${d}.webp`;const e=MUK_DMG[d][expr]||MUK_DMG[d].neutral;return `st_muk_${e}_d${d}.webp`;}
 const f=s[expr]||s.neutral;if(!f)return '';return (MISSING.has(f)&&OLD[f]?OLD[f]:f)+'.webp';};
// 새 그림이 아직 없으면 옛 그림으로 바꾼다.
for(const f of Object.keys(OLD)){const i=new Image();i.onerror=()=>MISSING.add(f);i.src=asset(f+'.webp');}
const bgFile=f=>f.replace(/\.(png|webp)$/,'')+'.webp';

// ── 대본 해석. "@명령 인자", "[이름|표정] 대사", "> 선택지 -> 라벨 {flag+1}", "// 주석", 나머지는 서술.
const chapters=[],byId={};
// 외전(id가 sp_로 시작): 본편 장 목록·장 선택에 넣지 않고, 끝나면 타이틀로 돌아간다. 타이틀 「외전」에서 연다.
const sides=[];
function chapter(id,title,subtitle,src){const ops=parse(src,id);const ch={id,title,subtitle,ops,labels:{},side:id.startsWith('sp_')};ops.forEach((o,i)=>{if(o.t==='label')ch.labels[o.arg]=i;});(ch.side?sides:chapters).push(ch);byId[id]=ch;}
function parse(src,id){
 const ops=[];let choice=null;
 for(const [n,raw] of src.split('\n').entries()){
  const line=raw.trim();
  if(!line||line.startsWith('//')){choice=null;continue;}
  if(line.startsWith('>')&&choice){const m=line.match(/^>\s*(.+?)\s*->\s*(\S+)(?:\s*\{(.+)\})?$/);if(!m)throw new Error(`${id}:${n+1} 선택지 형식`);choice.opts.push({text:m[1],label:m[2],set:m[3]||''});continue;}
  choice=null;
  if(line.startsWith('@')){
   const [cmd,...rest]=line.slice(1).split(/\s+/),arg=rest.join(' ');
   if(cmd==='choice'){choice={t:'choice',opts:[]};ops.push(choice);}
   else if(cmd==='show'){const [who,expr='neutral',pos='center']=rest;ops.push({t:'show',who:ALIAS[who]||who,expr,pos});}
   else if(cmd==='hide')ops.push({t:'hide',who:ALIAS[rest[0]]||rest[0]||'all'});
   else if(cmd==='chapter'){const [num,...title]=arg.split('|');ops.push({t:'chapter',num:num.trim(),title:title.join('|').trim()});}
   else if(cmd==='if'){const m=arg.match(/^(\w+)\s*(>=|<=|==|>|<)?\s*(-?\d+)?\s*->\s*(\S+)$/);if(!m)throw new Error(`${id}:${n+1} @if 형식`);ops.push({t:'if',flag:m[1],op:m[2]||'>=',val:m[3]==null?1:+m[3],label:m[4]});}
   else if(cmd==='top'){const m=arg.match(/^(.+?)\s*->\s*(\S+)$/);if(!m)throw new Error(`${id}:${n+1} @top 형식`);ops.push({t:'top',flags:m[1].trim().split(/\s+/),prefix:m[2]});}
   else if(cmd==='set'||cmd==='add'){const [flag,val='1']=rest;ops.push({t:cmd,flag,val:+val});}
   else ops.push({t:cmd,arg});
   continue;
  }
  const m=line.match(/^\[([^\]|]+)(?:\|(\w+))?\]\s*(.*)$/);
  if(m){const who=ALIAS[m[1].trim()]||m[1].trim();ops.push({t:'say',who,expr:m[2]||'',text:m[3]});}
  else ops.push({t:'narr',text:line});
 }
 return ops;
}

// ── 상태와 실행기.
let pendingFx={},S=null,typing=null,autoTimer=null,auto=false,skip=false,hidden=false,log=[],busy=false;
const fresh=ch=>({ch,pc:0,bg:'',chars:{},day:'',line:null,phone:false,flags:{...meta.flags}});
const curCh=()=>byId[S.ch];
// 짧은 컷(설정 컷·만남 컷): 대사·서술 두 줄 안에 다음 @bg로 넘어가면 곡을 바꾸지 않는다(한 줄짜리 그림에 사건 곡이 잠깐 끼어드는 것 막기).
const CUT_PASS=new Set(['show','hide','day','sfx','note','cutin','fx','wait','photo','outfit','mob','add','set','flash','shake','nod','hop','tilt','sink','sd']);
function shortCut(a){if(!/^cg_/.test(a))return false;const ops=curCh().ops;let n=0;for(let k=S.pc+1;k<ops.length;k++){const t=ops[k].t;if(t==='bg')return true;if(t==='say'||t==='narr'){if(++n>2)return false;}else if(!CUT_PASS.has(t))return false;}return false;}
function isRead(pc){return (meta.read[S.ch]||[]).includes(pc);}
function markRead(pc){const a=meta.read[S.ch]||(meta.read[S.ch]=[]);if(!a.includes(pc)){a.push(pc);if(a.length%10===0)persist();}}
function evalSet(spec){for(const part of spec.split(/[,\s]+/).filter(Boolean)){const m=part.match(/^(\w+)([+-]=?|=)(-?\d+)$/);if(!m)continue;const [,f,op,v]=m;S.flags[f]=op==='='?+v:(S.flags[f]||0)+(op.startsWith('-')?-v:+v);if(f==='orp')S.flags.orp=Math.min(100,S.flags.orp);}}
function step(){
 stopAuto();
 while(S&&!busy){
  const ch=curCh(),op=ch.ops[S.pc];
  if(S.replay&&(!op||(S.pc>S.replay.from&&(['dive','quiz','battle','end','ending'].includes(op.t)||(op.t==='bg'&&!/^cg_/.test(op.arg))))))return endReplay();
  if(!op)return finishChapter();
  switch(op.t){
   case 'label':S.pc++;break;
   case 'jump':S.pc=ch.labels[op.arg]??S.pc+1;break;
   case 'if':{const v=S.flags[op.flag]||0,ok={'>=':v>=op.val,'<=':v<=op.val,'==':v===op.val,'>':v>op.val,'<':v<op.val}[op.op];S.pc=ok?ch.labels[op.label]:S.pc+1;break;}
   case 'set':S.flags[op.flag]=op.val;S.pc++;break;
   // @top a b c -> 접두: 가장 큰 플래그(같으면 앞의 것)의 라벨 '접두+이름'으로. 모두 0이거나 라벨이 없으면 다음 줄.
   case 'top':{let best=null,bv=0;for(const f of op.flags){const v=S.flags[f]||0;if(v>bv){bv=v;best=f;}}S.flags.topWho=best?op.flags.indexOf(best)+1:0;const L=best!=null?ch.labels[op.prefix+best]:undefined;S.pc=L??S.pc+1;break;}
   // @ending 제목|한 줄: 이번에 본 엔딩. 끝 카드에 쓰고 records.endings에 모은다.
   case 'ending':{const [t,...d]=op.arg.split('|');S.ending={t:t.trim(),d:d.join('|').trim()};const e=records.endings||(records.endings=[]);if(!e.includes(S.ending.t))e.push(S.ending.t);save();S.pc++;break;}
   case 'add':S.flags[op.flag]=(S.flags[op.flag]||0)+op.val;if(op.flag==='orp')S.flags.orp=Math.min(100,S.flags.orp);S.pc++;break;
   case 'board':{const ids=op.arg.trim().split(/\s+/);if(ids.every(id=>(S.boardShown||[]).includes(id))){S.pc++;break;}return board(ids);}
   case 'sd':sdPop(op.arg.trim());S.pc++;break;
   case 'photo':S.photo=op.arg.trim()==='off'?null:op.arg.trim();if(S.photo&&Object.keys(S.chars).length>=3)for(const k of Object.keys(S.chars))if(S.chars[k].auto)delete S.chars[k];S.pc++;paint();break;
   case 'bg':BGM.chapter=S.ch;for(const k of Object.keys(S.chars))if(S.chars[k].auto)delete S.chars[k];S.photo=null;{const [a,b]=op.arg.split('|').map(x=>x.trim());S.bg=bgFile(a);S.bgAlt=b?bgFile(b):null;S.mood=[];S.cutin=null;if(!shortCut(a))BGM.scene(a);}S.pc++;paint();break;
   case 'bgm':BGM.chapter=S.ch;if(op.arg==='auto')BGM.scene(S.bg);else BGM.play(op.arg==='off'?'':op.arg);S.pc++;break;
   case 'show':{for(const k of Object.keys(S.chars))if(S.chars[k].auto&&k!==op.who&&(S.chars[k].pos===op.pos||Object.keys(S.chars).filter(x=>x!==op.who).length>=3))delete S.chars[k];
    const was=S.chars[op.who];const [c0,e0]=op.expr.includes('+')?op.expr.split('+'):[null,op.expr];S.chars[op.who]={expr:c0?e0:op.expr,pos:op.pos,home:op.pos,costume:c0&&COSTUME[op.who]?.has(c0)?c0:COSTUME[op.who]?.has(op.expr)?op.expr:was?.costume};fixSlots(op.who);if(!was)pendingFx[op.who]='enter';else if(was.expr!==op.expr&&EXPR_FX[op.expr])pendingFx[op.who]=EXPR_FX[op.expr];S.pc++;paint();break;}
   case 'phone':S.phone=op.arg!=='off';if(S.phone)SFX.play('phone');if(S.phone&&S.chars.orpheia)pendingFx.orpheia='enter';S.pc++;paint();break;
   case 'hop':case 'tilt':case 'nod':case 'sink':case 'shake':if(op.arg)pendingFx[ALIAS[op.arg]||op.arg]=op.t;S.pc++;paint();break;
   case 'hide':if(op.who==='all'){S.chars={};S.photo=null;}else{delete S.chars[op.who];fixSlots(null);}S.pc++;paint();break;
   case 'day':S.day=op.arg;return card('day',op.arg);
   case 'chapter':return card('chapter',op.num,op.title);
   // 시간 여행: @dive 연대|시대 — 빛의 통로를 지나 그 시대로 들어간다(배경은 다음 @bg).
   case 'dive':{const [when,...what]=op.arg.split('|');S.bg=bgFile('bg_timeline_dive');S.bgAlt=null;S.chars={};S.phone=false;S.photo=null;fx('flash');SFX.play('rewind');paint();return card('dive',when.trim(),what.join('|').trim());}
   // 상태창: @hud 제목|줄|줄 — {flag} 값을 채워 게임 HUD처럼 보여 준다.
   case 'hud':{const [t,...ls]=fill(op.arg).split('|');return card('hud',t.trim(),ls.map(x=>x.trim()).join('\n'));}
   case 'flash':fx('flash');SFX.play('flash');S.pc++;break;
   case 'sfx':SFX.play(op.arg);S.pc++;break;
   // 컷인: 배경은 그대로 두고 그림 한 장을 다음 대사 한 줄 동안 액자처럼 띄운다. `@cutin pout`은 삐진 오르페이아(옛 시대 장면이면 한복판).
   case 'cutin':{const a=op.arg.trim();S.cutin=a==='off'?null:{n:a,shown:false};S.pc++;paint();break;}
   // 호러·긴장 연출. 지속 분위기(MOOD)는 @fx off(또는 -이름)나 배경이 바뀔 때까지 남고, 순간 효과(HIT)는 한 번 친다.
   case 'fx':{const m=new Set(S.mood||[]);for(const k of op.arg.trim().split(/\s+/)){if(k==='off')m.clear();else if(k[0]==='-')m.delete(k.slice(1));else if(MOOD.includes(k))m.add(k);else if(HIT[k]){fx('hit-'+k,HIT[k][1]);if(HIT[k][0])SFX.play(HIT[k][0]);}}S.mood=[...m];paintMood();S.pc++;break;}
   case 'wait':busy=true;setTimeout(()=>{busy=false;S.pc++;step();},+op.arg||600);return;
   case 'choice':return choose(op);
   case 'quiz':return quiz(op.arg);
   case 'battle':return battle(op.arg.trim());
   // 연표 기록부: @note 제목|내용 — 본 것을 카드로 모은다. @summary — 이 장에서 모은 카드를 정리해 보여 준다.
   case 'note':{const [t,...b]=op.arg.split('|');addNote(S.ch,t.trim(),b.join('|').trim());S.pc++;break;}
   case 'summary':return summary();
   case 'end':return finishChapter(op.arg);
   case 'outfit':S.outfit=op.arg.trim()==='auto'?null:op.arg.trim();S.pc++;paint();break;
   case 'mob':{const [n,t]=op.arg.split('=').map(x=>x.trim());(S.mobMap||(S.mobMap={}))[n]=t;S.pc++;break;}
   case 'say':case 'narr':
    if(S.cutin){if(S.cutin.shown)S.cutin=null;else S.cutin.shown=true;}
    if(op.t==='say'&&!CAST[op.who]){const t=(S.mobMap||{})[op.who]??MOB_BY_NAME[op.who];const id=t&&t!=='none'?'mob_'+t:null;
     if(id&&!S.chars[id]){for(const k of Object.keys(S.chars))if(k.startsWith('mob_')&&S.chars[k].auto)delete S.chars[k];
      const others=Object.values(S.chars);let pos=null;
      if(!others.length)pos='center';else if(others.length===1)pos=others[0].pos==='right'?'left':'right';else if(others.length===2&&!S.photo&&!S.phone){const u=new Set(others.map(c=>c.pos));pos=['center','left','right'].find(p=>!u.has(p))||null;}
      if(pos){if(others.length===1&&others[0].pos==='center')others[0].pos=pos==='right'?'left':'right';S.chars[id]={expr:'neutral',pos,auto:true};pendingFx[id]='enter';}}
     S.speakingMob=id;}else if(op.t==='say')S.speakingMob=null;
    // 그 인물에게 없는 표정이면 지금 그림을 그대로 둔다(나루처럼 시대 옷으로만 그린 인물이 사라지거나 옷이 바뀌지 않게).
    if(op.t==='say'&&op.expr&&S.chars[op.who]&&(CAST[op.who]?.stand?.[op.expr]||COSTUME_EXPR[op.who]?.has(op.expr)||(op.who==='sayeon'&&S.sayeonDmg&&SAYEON_DMG_OK))){if(S.chars[op.who].expr!==op.expr&&EXPR_FX[op.expr])pendingFx[op.who]=EXPR_FX[op.expr];S.chars[op.who].expr=op.expr;}
    S.line={who:op.who||'',text:fill(op.text),expr:op.expr||S.chars[op.who]?.expr||'neutral'};
    log.push({who:nameOf(S.line.who),text:S.line.text});if(log.length>LOG_MAX)log.shift();
    if(skip&&!isRead(S.pc))skip=false;
    markRead(S.pc);paint();return type();
   default:S.pc++;
  }
 }
}
// 대사 안의 {quizFirst} 같은 표시는 현재 값으로 바꾼다.
const fill=t=>t.replace(/\{(\w+)\}/g,(_,k)=>S.flags[k]??0);
function nameOf(who){return CAST[who]?.name??who;}
function advance(){
 if(!S||busy)return;
 if(hidden){setHidden(false);return;}
 if(typing){finishType();return;}
 if(S.line){S.line=null;S.pc++;step();}
}

// ── 한 글자씩 찍기.
function type(){
 const node=$('#vnText');if(!node)return;
 const text=S.line.text,speed=skip?0:records.textSpeed;
 clearTimeout(typing?.t);
 if(!speed){node.textContent=text;typing=null;return afterLine();}
 let i=0;typing={t:null};
 const voice=S.line.who?(CAST[S.line.who]?S.line.who:'other'):'narration';
 const tick=()=>{i++;node.textContent=text.slice(0,i);SFX.blip(voice,text[i-1]);if(i>=text.length){typing=null;afterLine();return;}const c=text[i-1];typing.t=setTimeout(tick,speed+(/[.!?。…]/.test(c)?160:/[,，]/.test(c)?70:0));};
 tick();
}
function finishType(){clearTimeout(typing?.t);typing=null;const n=$('#vnText');if(n&&S.line)n.textContent=S.line.text;afterLine();}
function afterLine(){$('#vnCaret')?.classList.add('ready');if(skip)autoTimer=setTimeout(advance,40);else if(auto)autoTimer=setTimeout(advance,meta.settings.auto+S.line.text.length*25);}
function stopAuto(){clearTimeout(autoTimer);}

// ── 그리기.
function shell(){
 document.body.classList.add('vn-mode');
 $('#main').innerHTML=`<section class="vn" id="vn" aria-label="비주얼 노벨"><div class="vn-layer vn-bg"><img id="vnBg" alt=""></div><div class="vn-layer vn-chars" id="vnChars"></div><figure class="vn-photo" id="vnPhoto" hidden title="눌러서 크게 보기"><div class="vn-photo-frame"><img alt=""></div><figcaption><b></b><small></small></figcaption></figure><div class="vn-phone" id="vnPhone" hidden><div class="vn-phone-notch"></div><div class="vn-phone-screen"></div></div><div class="vn-layer vn-fx" id="vnFx"></div><div class="vn-day" id="vnDay"></div><div class="vn-card" id="vnCard" hidden></div><div class="vn-choices" id="vnChoices" hidden></div>
 <div class="vn-box" id="vnBox"><div class="vn-name" id="vnName"><b id="vnWho"></b></div><p class="vn-text" id="vnText" aria-live="polite"></p><span class="vn-caret" id="vnCaret">▼</span></div>
 <nav class="vn-menu" aria-label="메뉴">${[['notebook','기록부'],['log','로그'],['auto','오토'],['skip','스킵'],['save','세이브'],['load','로드'],['qsave','Q.세이브'],['qload','Q.로드'],['config','설정'],['hide','숨기기'],['title','타이틀']].map(([k,v])=>`<button data-vn="${k}">${v}</button>`).join('')}</nav></section>`;
 const vn=$('#vn');
 vn.addEventListener('click',e=>{if(e.target.closest('.vn-menu,.vn-choices,.vn-card button,.qz'))return;advance();});
 vn.addEventListener('contextmenu',e=>{e.preventDefault();setHidden(!hidden);});
 vn.querySelectorAll('[data-vn]').forEach(b=>b.onclick=e=>{e.stopPropagation();menu(b.dataset.vn);});
}
// 문화재 사진: 기출 보기 사진(QUESTION_FIGURES, 이름 확인된 것)과 따로 모은 사진(data/heritage.js)에서 이름으로 찾는다.
function heritage(name){
 const H=window.HERITAGE||{},F=window.QUESTION_FIGURES||{};
 if(H[name])return {src:H[name].local?asset(H[name].src):figSrc(H[name].src),credit:H[name].credit,desc:H[name].desc};
 let near=null;
 for(const [k,v] of Object.entries(F))for(const c of v.choices||[]){
  if(c.nameStatus!=='identified')continue;const [r,n]=k.split('-'),hit={src:figSrc(c.src),credit:`제${r}회 ${n}번 기출 보기 사진`};
  if(c.name===name)return hit;if(!near&&(c.name.includes(name)||name.includes(c.name)))near=hit;}
 if(!near)for(const [k,v] of Object.entries(H))if(k.includes(name)||name.includes(k)){near={src:v.local?asset(v.src):figSrc(v.src),credit:v.credit,desc:v.desc};break;}
 return near;
}
// 학습만화식 SD 리액션 컷인: @sd idea|warn|thumbs|cry|pout|shock|love|teach|detective|cheer|think|bow — 2.4초 뒤 사라진다(세이브에 남지 않음).
// 판서: 기출 핵심노트(CORE_NOTES)를 이야기 속 칠판으로 띄운다. @board 노트id [노트id…]
const NOTE_FILES=['ancient','goryeo-joseon','modern','contemporary'];
async function coreNotes(){if(window.CORE_NOTES?.length)return window.CORE_NOTES;await Promise.all(NOTE_FILES.map(f=>loadOnce(`data/core-notes/${f}.js`).catch(()=>loadOnce(figSrc(`core-notes/${f}.js`)))));return window.CORE_NOTES||[];}
const hl=t=>esc(t).replace(/\*\*([^*]+)\*\*/g,'<b class="bd-b">$1</b>').replace(/(\d{2}-\d{1,2})/g,'<i class="bd-q">$1</i>');
function boardHtml(n,hide){
 const hid=x=>(hide||[]).some(k=>String(x).includes(k));
 const tb=(n.tables||[]).map(t=>`<figure class="bd-t"><figcaption>${hl(t.c||'')}</figcaption><table><thead><tr>${t.h.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${t.r.map(r=>`<tr>${r.map(c=>`<td>${hl(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></figure>`).join('');
 const traps=(n.traps||[]).filter(x=>!hid(typeof x==='string'?x:JSON.stringify(x)));
 const tr=traps.length?`<div class="bd-traps"><b>함정 주의</b><ul>${traps.map(x=>`<li>${hl(typeof x==='string'?x:(x.t||x.text||JSON.stringify(x)))}</li>`).join('')}</ul></div>`:'';
 const ky=(n.keys||[]).length?`<div class="bd-keys"><b>이 단어가 보이면</b>${n.keys.map(x=>Array.isArray(x)?`<div><span>${esc(x[0])}</span> → <em>${esc(x[1])}</em></div>`:`<div><span>${esc(String(x))}</span></div>`).join('')}</div>`:'';
 return `<section class="bd-note"><h3><i class="vn-seal mini">板</i>${esc(n.title)}</h3>${tr}${ky}${tb}</section>`;
}
// 문제 앞 판서: 문제 주제(시대/주제·문항 키)에 맞는 핵심노트를 이 장에서 아직 안 펼쳤으면, 풀기 전에 먼저 펼친다(먼저 배우고 푼다).
function notesFor(keys){
 const N=window.CORE_NOTES||[],Q=window.QS||[],norm=x=>String(x).replace(/\s/g,''),out=[];
 for(const k of keys){const [r,n]=k.split('-').map(Number);const q=Q.find(x=>x.r===r&&x.n===n);if(!q)continue;
  const t=norm(q.era+'/'+q.topic),era=norm(q.era),tp=norm(q.topic).replace(/시대$/,'');
  let m=N.filter(x=>(x.match||[]).some(y=>norm(y)===t||y===k));
  if(!m.length)m=N.filter(x=>(x.match||[]).some(y=>{const [e,tt='']=norm(y).split('/');return e===era&&tt&&(tt.includes(tp)||tp.includes(tt));}));
  for(const x of m.slice(0,1))if(!out.includes(x.id))out.push(x.id);}
 return out;
}
function board(ids,after,pre,hide){
 paint();busy=true;S.line=null;stopAuto();const c=$('#vnCard');c._tok=(c._tok||0)+1;$('#vnBox').classList.add('quiet');c.className='vn-card board';c.hidden=false;c.onclick=null;
 const sh=S.boardShown||(S.boardShown=[]);ids.forEach(id=>{if(!sh.includes(id))sh.push(id);});
 c.innerHTML=`<div class="bd-wrap"><div class="bd-head"><small><img class="bd-emblem" src="${asset('emblem_white.webp')}" alt="">${pre?'풀기 전에 · 오르페이아의 판서':'오르페이아의 판서 · 기출 핵심노트'}</small><button class="primary" data-back>${pre?'알겠어요, 풀러 가기 ▶':'정리 끝 ▶'}</button></div>${pre?'<p class="bd-pre">주인님, 문제 나오기 전에 이것부터요! 표의 「단서 → 정답」만 눈에 담고 가면 돼요♪</p>':''}<div class="bd-body"><p class="vn-sheet-wait">칠판을 펼치는 중이에요…</p></div></div>`;
 const done=e=>{e?.stopPropagation();c.hidden=true;$('#vnBox').classList.remove('quiet');busy=false;if(after)after();else{S.pc++;step();}};
 c.querySelector('[data-back]').onclick=done;
 if(skip){done();return;}
 const nb=records.boards||(records.boards=[]);ids.forEach(id=>{if(!nb.includes(id))nb.push(id);});save();
 coreNotes().then(all=>{const body=c.querySelector('.bd-body');if(!body)return;const ns=ids.map(id=>all.find(x=>x.id===id)).filter(Boolean);
  body.innerHTML=ns.length?ns.map(n=>boardHtml(n,hide)).join(''):'<p>판서를 불러오지 못했어요.</p>';}).catch(()=>{const b=c.querySelector('.bd-body');if(b)b.innerHTML='<p>판서를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.</p>';});
}
function sdPop(kind){
 const v=$('#vn');if(!v||skip)return;let el=$('#vnSd');if(!el){el=document.createElement('img');el.id='vnSd';el.className='vn-sd';el.alt='';v.appendChild(el);}
 el.onerror=()=>{el.hidden=true;};el.hidden=false;el.src=asset(`sd_orp_${kind}.webp`);el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');
 clearTimeout(el._t);el._t=setTimeout(()=>{el.hidden=true;},2400);
}
const CUTIN={pout:()=>orpHanbok()?'cg_orpheia_jealous_hanbok':'cg_orpheia_jealous',
 shy:()=>orpHanbok()?'cg_cut_orp_shy_hanbok':'cg_cut_orp_shy',smug:()=>orpHanbok()?'cg_cut_orp_smug_hanbok':'cg_cut_orp_smug',teary:()=>orpHanbok()?'cg_cut_orp_teary_hanbok':'cg_cut_orp_teary',
 fan:()=>'cg_cut_yunseul_fan',rage:()=>'cg_cut_yunseul_rage',muk:()=>'cg_cut_muk_smirk',record:()=>'cg_cut_sayeon_record',shock:()=>'cg_cut_sangcheol_shock',hands:()=>'cg_cut_hands',comments:()=>'cg_cut_comments'};
const CUTIN_ALL={pout:['cg_orpheia_jealous','cg_orpheia_jealous_hanbok'],shy:['cg_cut_orp_shy','cg_cut_orp_shy_hanbok'],smug:['cg_cut_orp_smug','cg_cut_orp_smug_hanbok'],teary:['cg_cut_orp_teary','cg_cut_orp_teary_hanbok']};
function paintCutin(){
 const v=$('#vn');if(!v)return;let el=$('#vnCutin');
 if(!S.cutin){if(el)el.hidden=true;return;}
 if(!el){el=document.createElement('figure');el.id='vnCutin';el.className='vn-cutin';el.innerHTML='<img alt="">';v.appendChild(el);}
 const n=(CUTIN[S.cutin.n]||(()=>S.cutin.n))(),src=asset(n+'.webp'),img=el.querySelector('img');
 if(img.dataset.f!==src){img.dataset.f=src;img.onerror=()=>{if(n.endsWith('_hanbok'))img.src=asset(n.replace(/_hanbok$/,'')+'.webp');};img.src=src;el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');seeCg(src);}
 el.hidden=false;
}
function paintPhoto(){
 const el=$('#vnPhoto');if(!el)return;const [name,label]=String(S.photo||'').split('|').map(x=>x.trim()),h=name&&heritage(name);
 el.hidden=!h;$('#vn').classList.toggle('photo-on',!!h);if(!h){el.classList.remove('big');return;}
 const img=el.querySelector('img');if(img.dataset.f!==h.src){img.dataset.f=h.src;img.src=h.src;img.alt=label||name;el.classList.remove('big');}
 el.querySelector('b').textContent=label||name;el.querySelector('small').textContent=(h.desc?h.desc+' — ':'')+h.credit;
 el.onclick=e=>{e.stopPropagation();el.classList.toggle('big');};
}
function paint(){
 if(!$('#vn'))shell();
 const bg=$('#vnBg');if(bg&&S.bg&&bg.dataset.f!==S.bg){bg.dataset.f=S.bg;bg.style.visibility='';bg.onload=()=>{bg.dataset.ok=bg.src;seeCg(bg.src);};bg.onerror=()=>{const alt=S.bgAlt&&asset(S.bgAlt);if(alt&&!bg.src.endsWith(S.bgAlt)){bg.src=alt;return;}if(bg.dataset.ok&&bg.src!==bg.dataset.ok)bg.src=bg.dataset.ok;else bg.style.visibility='hidden';};bg.src=asset(S.bg);}   // 아직 생성되지 않은 그림이면 직전 배경을 그대로 둔다
 paintChars();paintPhoto();paintMood();paintCutin();
 {const [m,sub]=String(S.day||'').split('|');$('#vnDay').innerHTML=m?esc(m)+(sub?`<small class="vn-day-era">${esc(sub)}</small>`:''):'';}
 const l=S.line,box=$('#vnBox');
 box.className='vn-box'+(l?.who?' '+(CAST[l.who]?.cls||'c-other'):' is-narr');
 $('#vnWho').textContent=l?.who?nameOf(l.who):'';$('#vnName').hidden=!l?.who;
 $('#vnText').textContent='';$('#vnCaret').classList.remove('ready');
 $('#vn').querySelector('[data-vn="auto"]').classList.toggle('on',auto);$('#vn').querySelector('[data-vn="skip"]').classList.toggle('on',skip);
}
function paintChars(){
 const wrap=$('#vnChars'),phone=$('#vnPhone');if(!wrap)return;
 const inPhone=who=>S.phone&&who==='orpheia';
 // CG 장면에서는 스탠딩·휴대폰을 숨기고 CG 한 장으로만 보여 준다(상태는 그대로 두고 CG가 끝나면 다시 나온다).
 // 사람이 안 나오는 풍경형 CG는 배경처럼 쓴다(스탠딩을 얹는다).
 const STAGE=/(^|\/)cg_(ch01_dolmen|ch02_baekje|ch03_palace_night|ch04_goryeo_port|ink_spread|comment_flame)\b/;
 const bgName=String(S.bg||''),cg=/(^|\/)cg_/.test(bgName)&&!STAGE.test(bgName);
 wrap.hidden=cg;phone.hidden=cg||!(S.phone&&S.chars.orpheia);
 $('#vn')?.classList.toggle('phone-on',!phone.hidden);
 const keep=new Set();
 for(const [who,c] of Object.entries(S.chars)){
  const file=standFile(who,c.expr);if(!file)continue;keep.add(who);
  const host=inPhone(who)?phone.querySelector('.vn-phone-screen'):wrap;
  let el=document.getElementById('chr-'+who);
  if(!el||el.parentElement!==host){el?.remove();el=document.createElement('div');el.id='chr-'+who;el.innerHTML='<div class="vn-chr-fx"><img alt=""></div>';host.appendChild(el);}
  el.className=`vn-chr pos-${c.pos}${who.startsWith('mob_')?' mob':''}${S.line?.who===who||who===S.speakingMob||!S.line?.who?' speaking':''}`;
  const img=el.querySelector('img');if(img.dataset.f!==file){img.dataset.f=file;img.onerror=()=>{const fb=standFile(who,'neutral');if(fb&&!img.src.endsWith(fb))img.src=asset(fb);};img.src=asset(file);img.alt=nameOf(who);}
  const fxName=pendingFx[who];if(fxName){const f=el.firstChild;f.className='vn-chr-fx';void f.offsetWidth;f.classList.add('fx-'+fxName);}
 }
 pendingFx={};wrap.dataset.n=[...keep].filter(w=>!inPhone(w)).length;
 for(const el of [...wrap.children,...phone.querySelector('.vn-phone-screen').children])if(!keep.has(el.id.slice(4)))el.remove();
}
function setHidden(v){hidden=v;$('#vn')?.classList.toggle('ui-hidden',v);}
function fx(kind,ms=700){const vn=$('#vn');if(!vn)return;vn.classList.remove(kind);void vn.offsetWidth;vn.classList.add(kind);setTimeout(()=>vn.classList.remove(kind),ms);}
// @fx: 지속 분위기 = 어둠(가장자리부터 조여 옴)·깜빡임(형광등)·냉기(색 빠짐)·떨림(글자가 떨림)·조여옴(배경이 아주 천천히 다가옴)
const MOOD=['dark','flicker','cold','tremble','dread'];
// 순간 효과: [효과음, 지속 ms]
const HIT={black:['',900],thud:['thud',600],pulse:['heartbeat',1900],glitch:['vb_glitch',700],zoom:['',900]};
function paintMood(){const vn=$('#vn');if(!vn)return;for(const k of MOOD)vn.classList.toggle('mood-'+k,(S.mood||[]).includes(k));}
function card(kind,a,b){
 paint();busy=true;S.line=null;const c=$('#vnCard');$('#vnBox').classList.add('quiet');
 c.className='vn-card '+kind;c.hidden=false;if(kind==='chapter')SFX.play('card');c.innerHTML=kind==='chapter'?(()=>{const [m,...sub]=String(b).split(' — ');return `<div class="vn-scroll"><img class="vn-crest scroll" src="${asset('emblem_gold.webp')}" alt=""><span class="vn-seal">${esc(a)}</span><h2>${esc(m)}</h2>${sub.length?`<p>${esc(sub.join(' — '))}</p>`:''}</div>`;})():kind==='dive'?`<div class="vn-dive-emblem"><img src="${asset('emblem_white.webp')}" alt=""><i></i></div><em class="vn-dive-tag">ORPHEIA · MV SCENE ENGINE</em><small>${esc(a)}</small><h2>${esc(b)}</h2>`:kind==='hud'?`<div class="vn-hud"><img class="vn-hud-emblem" src="${asset('emblem_gold.webp')}" alt=""><b>${esc(a)}</b><pre>${esc(b)}</pre></div>`:kind==='day'?(()=>{const [m,sub]=String(a).split('|');return `<p>${esc(m)}${sub?`<small class="vn-day-era">${esc(sub)}</small>`:''}</p>`;})():`<p>${esc(a)}</p>`;if(kind==='hud')SFX.play('card');
 const tok=c._tok=(c._tok||0)+1;const done=()=>{if(c.hidden||c._tok!==tok)return;c.hidden=true;$('#vnBox')?.classList.remove('quiet');busy=false;S.pc++;step();};
 c.onclick=e=>{e.stopPropagation();done();};setTimeout(done,skip?150:kind==='hud'?4200:kind==='chapter'||kind==='dive'?2600:1700);
}
function choose(op){
 S.line=null;paint();stopAuto();skip=false;const box=$('#vnChoices');box.hidden=false;$('#vnBox').classList.add('quiet');
 box.innerHTML=op.opts.map((o,i)=>`<button data-i="${i}"><span>${i+1}</span>${esc(o.text)}</button>`).join('');
 SFX.play('select');
 const pick=i=>{const o=op.opts[i];if(!o)return;SFX.play('confirm');box.hidden=true;box.innerHTML='';$('#vnBox').classList.remove('quiet');log.push({who:'▶ 선택',text:o.text});if(o.set)evalSet(o.set);S.pc=curCh().labels[o.label]??S.pc+1;VN._pick=null;step();};
 box.querySelectorAll('button').forEach(b=>b.onclick=e=>{e.stopPropagation();pick(+b.dataset.i);});
 VN._pick=pick;
}

// ── 연표 기록부.
function addNote(ch,title,body){const nb=records.notebook||(records.notebook={}),list=nb[ch]||(nb[ch]=[]);if(!list.some(n=>n.t===title))list.push({t:title,b:body});save();
 const f=$('#vnFx');if(!f)return;const el=document.createElement('div');el.className='vn-note-pop';el.innerHTML=`<small><i class="vn-seal mini">記</i>연표 기록부</small><b>${esc(title)}</b>`;f.appendChild(el);SFX.play('save');setTimeout(()=>el.remove(),2600);}
function notesHtml(ch){const list=(records.notebook||{})[ch]||[];return list.length?`<div class="vn-notes">${list.map(n=>`<div class="vn-notecard"><b>${esc(n.t)}</b><p>${esc(n.b)}</p></div>`).join('')}</div>`:'<p>아직 모은 기록이 없어요.</p>';}
// 정리 페이지: 손필기식 요약노트(assets/kh/summary*)를 불러와 펼친다.
const SHEETS={ch01:['ancient-1'],ch02:['ancient-1'],ch03:['ancient-1','ancient-2'],ch04:['ancient-1'],ch05:['unified-1'],ch06:['unified-1'],
 ch07:['goryeo-1'],ch08:['goryeo-1'],ch09:['goryeo-2','goryeo-1'],ch10:['joseon1-1','joseon1-2'],ch11:['joseon1-1'],ch12:['joseon2-1'],ch13:['joseon2-2','joseon2-1'],
 ch14:['gaehang-1'],ch15:['gaehang-2'],ch16:['gaehang-2'],ch17:['ilje-1'],ch18:['ilje-2'],ch19:['ilje-2'],ch20:['ilje-3'],ch21:['modern-1'],ch22:['modern-1'],ch23:['modern-2','modern-1'],ch24:['integrated-1']};
const SHEET_FILE=id=>({'ancient-1':'ancient1','ancient-2':'ancient2','unified-1':'unified','integrated-1':'modern'})[id]||id.split('-')[0];
const loaded={};
function loadOnce(url,kind){return loaded[url]||(loaded[url]=new Promise((ok,no)=>{const el=document.createElement(kind==='css'?'link':'script');if(kind==='css'){el.rel='stylesheet';el.href=url;}else el.src=url;el.onload=ok;el.onerror=no;document.head.appendChild(el);}));}
async function openSheets(ch){
 const ids=SHEETS[ch]||[],d=$('#vnLog');if(!ids.length)return;
 d.innerHTML=`<div class="dialog-header"><div><small>정리 페이지</small><h2>요약노트</h2></div><button class="quiet" data-close>닫기 ×</button></div><p class="vn-sheet-wait">요약노트를 불러오는 중이에요…</p>`;
 d.classList.add('sheets');d.querySelector('[data-close]').onclick=()=>d.close();d.onclose=()=>d.classList.remove('sheets');if(!d.open)d.showModal();
 try{
  await loadOnce(figSrc('summary.css'),'css');await loadOnce(figSrc('summary-render.js'));
  await Promise.all([...new Set(ids.map(SHEET_FILE))].map(f=>loadOnce(figSrc(`summary/${f}.js`))));
  const all=window.SUMMARY_SHEETS||[],html=ids.map(id=>all.find(x=>x.id===id)).filter(Boolean).map(x=>window.SummaryNotes.sheet(x,{sourceLabel:'기출 요약노트'})).join('');
  const w=document.createElement('div');w.className='sm-wrap';w.innerHTML=html;
  w.querySelectorAll('img').forEach(i=>{const a=i.getAttribute('src');if(a&&!/^(https?:|data:)/.test(a))i.src=figSrc(a);});
  d.querySelector('.vn-sheet-wait').replaceWith(w);
 }catch(e){const p=d.querySelector('.vn-sheet-wait');if(p)p.textContent='요약노트를 불러오지 못했어요.';}
}
function summary(){
 S.line=null;paint();busy=true;stopAuto();skip=false;const c=$('#vnCard');c._tok=(c._tok||0)+1;$('#vnBox').classList.add('quiet');c.className='vn-card summary';c.hidden=false;
 c.innerHTML=`<small>연표 기록부 · ${esc(curCh().title)}</small><h2>${esc(curCh().subtitle)}</h2>${notesHtml(S.ch)}<div class="vn-sum-btns">${SHEETS[S.ch]?'<button class="quiet" data-sheets>📜 정리 페이지 펼치기</button>':''}<button class="primary" data-back>이야기로 돌아가기 ▶</button></div>`;
 const sb=c.querySelector('[data-sheets]');if(sb)sb.onclick=e=>{e.stopPropagation();openSheets(S.ch);};
 c.onclick=null;c.querySelector('[data-back]').onclick=e=>{e.stopPropagation();c.hidden=true;$('#vnBox').classList.remove('quiet');busy=false;S.pc++;step();};
}
// ── 연표 기록부: 공부용으로 세 가지 보기. 장별 노트(왼쪽 장 목록·오른쪽 카드), 판서(한 장씩 넘기기), 연표(연도 순). 위쪽 검색은 세 보기 모두에 걸린다.
function boardChapters(){const m={};for(const c of chapters)for(const o of c.ops)if(o.t==='board')for(const id of o.arg.trim().split(/\s+/))if(!m[id])m[id]=c.id;return m;}
const yearOf=n=>{const m=/(?:기원전\s*)?(\d{3,4})(?=\s*년|[)~·,\s])/.exec(n.t+' '+n.b);if(!m)return null;const y=+m[1];return /기원전/.test(m[0])?-y:y;};
function notebook(view='notes',sel=null,q=''){
 const d=$('#vnLog');d.className='sheets gallery nb';const nb=records.notebook||{},bids=records.boards||[],bch=boardChapters();
 const all=[];for(const c of chapters)for(const n of nb[c.id]||[])all.push({...n,ch:c.id,ct:c.title});
 const hit=n=>!q||(n.t+' '+n.b).includes(q);
 const chs=chapters.filter(c=>(nb[c.id]||[]).length||bids.some(id=>bch[id]===c.id));
 const tabs=`<nav class="gl-tabs nb-tabs">${[['notes',`장별 노트 ${all.length}`],['boards',`판서 ${bids.length}`],['time','연표 순서']].map(([k,v])=>`<button data-view="${k}" class="${k===view?'on':''}">${v}</button>`).join('')}<input class="nb-q" type="search" placeholder="검색: 인물·사건·연도" value="${esc(q)}"></nav>`;
 let body='';
 if(!all.length&&!bids.length)body='<p class="mg-sum">이야기를 진행하면 그 시대에서 본 것이 여기에 쌓여요.</p>';
 else if(view==='notes'){const cur=sel&&chs.some(c=>c.id===sel)?sel:(q?'all':chs[0]?.id);
  const list=all.filter(n=>(cur==='all'||n.ch===cur)&&hit(n));
  body=`<div class="nb-wrap"><aside class="nb-side"><button data-ch="all" class="${cur==='all'?'on':''}">전체 <small>${all.filter(hit).length}</small></button>${chs.map(c=>`<button data-ch="${c.id}" class="${c.id===cur?'on':''}">${esc(c.title)}<span>${esc(c.subtitle||'')}</span><small>${(nb[c.id]||[]).filter(hit).length}</small></button>`).join('')}</aside>
  <section class="nb-main">${list.length?`<div class="vn-notes">${list.map(n=>`<div class="vn-notecard">${cur==='all'?`<small class="nb-ch">${esc(n.ct)}</small>`:''}<b>${esc(n.t)}</b><p>${esc(n.b)}</p></div>`).join('')}</div>`:'<p class="mg-sum">찾는 기록이 없어요.</p>'}</section></div>`;}
 else if(view==='boards'){body=`<div class="nb-wrap"><aside class="nb-side nb-bside"><p class="vn-sheet-wait">판서 목록을 불러오는 중…</p></aside><section class="nb-main nb-board"><p class="vn-sheet-wait">판서를 불러오는 중…</p></section></div>`;}
 else{const L=all.filter(hit).map(n=>({...n,y:yearOf(n)})).filter(n=>n.y!=null).sort((a,b)=>a.y-b.y);
  body=`<p class="mg-sum">노트 제목·내용에 나온 첫 연도로 줄을 세웠어요(연도가 없는 노트는 「장별 노트」에서 보세요).</p><ol class="nb-time">${L.map(n=>`<li><span class="nb-y">${n.y<0?'기원전 '+(-n.y):n.y}</span><div><b>${esc(n.t)}</b><small>${esc(n.ct)}</small><p>${esc(n.b)}</p></div></li>`).join('')||'<li>아직 연도가 붙은 기록이 없어요.</li>'}</ol>`;}
 d.innerHTML=`<div class="dialog-header"><div><small>NOTEBOOK</small><h2>연표 기록부</h2></div><button class="quiet" data-close>닫기 ×</button></div>${tabs}<div class="nb-body">${body}</div>`;
 d.querySelector('[data-close]').onclick=()=>{d.close();d.className='';};
 d.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>notebook(b.dataset.view,null,q));
 d.querySelectorAll('[data-ch]').forEach(b=>b.onclick=()=>notebook('notes',b.dataset.ch,q));
 const qi=d.querySelector('.nb-q');let t;qi.oninput=()=>{clearTimeout(t);t=setTimeout(()=>{const pos=qi.value;notebook(view,view==='notes'?'all':sel,pos);const n=$('#vnLog .nb-q');n.focus();n.setSelectionRange(pos.length,pos.length);},250);};
 if(view==='boards'&&bids.length)coreNotes().then(notes=>{if(!d.open||!d.querySelector('.nb-bside'))return;
  const L=bids.map(id=>notes.find(x=>x.id===id)).filter(Boolean).filter(n=>!q||JSON.stringify(n).includes(q));
  const ord=chapters.map(c=>c.id);L.sort((a,b)=>ord.indexOf(bch[a.id])-ord.indexOf(bch[b.id]));
  let i=Math.max(0,L.findIndex(n=>n.id===sel));
  const side=d.querySelector('.nb-bside'),main=d.querySelector('.nb-board');
  const draw=()=>{side.innerHTML=L.map((n,k)=>`<button data-b="${k}" class="${k===i?'on':''}">${esc(n.title)}<span>${esc((chapters.find(c=>c.id===bch[n.id])||{}).title||'')}</span></button>`).join('')||'<p class="mg-sum">찾는 판서가 없어요.</p>';
   main.innerHTML=L.length?`<div class="nb-bnav"><button data-step="-1">‹ 이전</button><small>${i+1} / ${L.length}</small><button data-step="1">다음 ›</button></div><div class="bd-wrap bd-inline"><div class="bd-body">${boardHtml(L[i])}</div></div>`:'';
   side.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{i=+b.dataset.b;draw();});
   main.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{i=(i+ +b.dataset.step+L.length)%L.length;draw();main.scrollTop=0;});
   side.querySelector('.on')?.scrollIntoView({block:'nearest'});};
  draw();}).catch(()=>{});
 if(!d.open)d.showModal();
}

// ── 기출 문항. quiz.js 가 문제를 띄우고, 끝나면 결과를 플래그로 돌려준다.
//    quizFirst: 이번 묶음에서 첫 시도에 맞힌 수, quizTotal: 이번 묶음 문항 수, quizAll: 이야기 전체 누적.
function quiz(arg,noPre){
 if(!noPre&&!skip){const ids=notesFor(String(arg).split(/\s+/).filter(x=>/^(\d+|자작)-\d+$/.test(x))).filter(id=>!(S.boardShown||[]).includes(id));
  if(ids.length){coreNotes().then(()=>{const ids2=notesFor(String(arg).split(/\s+/).filter(x=>/^(\d+|자작)-\d+$/.test(x))).filter(id=>!(S.boardShown||[]).includes(id));if(ids2.length)board(ids2,()=>quiz(arg,true),true,String(arg).split(/\s+/));else quiz(arg,true);}).catch(()=>quiz(arg,true));return;}
  if(!window.CORE_NOTES?.length&&!quiz._tried){quiz._tried=1;busy=true;coreNotes().then(()=>quiz(arg,false)).catch(()=>quiz(arg,true));return;}}
 autosave('문제 직전');busy=true;stopAuto();skip=false;auto=false;S.line=null;paint();
 if(S.battle)battleHud();
 Quiz.run(arg,{host:$('#vn'),bgm:S.battle?(S.battle.serious?'bgm_tragic':S.battle.who==='sayeon'?'bgm_sayeon':'bgm_challenge'):null,onAnswer:S.battle?battleHit:null,onDone:R=>{
  S.flags.quizFirst=R.first;S.flags.quizTotal=R.total;S.flags.quizAll=(S.flags.quizAll||0)+R.first;S.flags.quizAllTotal=(S.flags.quizAllTotal||0)+R.total;S.flags.quizRate=S.flags.quizAllTotal?Math.round(100*S.flags.quizAll/S.flags.quizAllTotal):0;
  $('#vnBattleHud')?.remove();busy=false;BGM.scene(S.bg);S.pc++;step();
 }});
}

// ── 묵 배틀. @battle muk [serious] … @quiz … @battle end
//    첫 시도에 맞힐 때마다 묵의 먹물 옷이 한 단계씩 찢어진다(cg_muk_b0~b3). serious: 옷 대신 먹물이 빛으로 흩어진다.
//    연출: VS 컷인 → 게이지·콤보 → 정답마다 히트스톱·베기·옷 조각 파편 → 오답은 먹물 반격 → 마지막은 FINISH/K.O. → 등급.
const MUK_TAUNT=['이유? 그런 거 없어도 외워지던데?','연도만 맞으면 되잖아. 순서는 내가 섞어 줄게.','이번 문제지는 내 거야. 가져갈 수 있으면 가져가 봐.','오르페이아, 네 주인님 시험 운은 어떨까?'];
const MUK_BREAK={
 1:['……소매쯤이야. 이유 하나 붙였다고 우쭐하지 마!','윽, 이 정도로……! 아직 한참 남았거든!'],
 2:['자, 잠깐! 거긴…… 보지 마! 이건 먹물이 모자라서 그런 거라고!','어, 어깨……! 오르페이아, 네 주인님 눈 좀 가려!'],
 3:['~~~~~!! 다 벗겨 놓고 이유까지 붙이면…… 나한테 뭐가 남는데……!','보, 보지 마……! 이번만…… 이번만 진 걸로 해 줄게……!'],
};
const MUK_SERIOUS={1:'먹물 한 겹이 빛이 되어 흩어진다.',2:'엉킨 연도 하나가 풀리며, 묵의 소매가 투명해진다.',3:'이유를 되찾은 기록이 하얗게 빛난다. 묵이 조용히 눈을 감는다.'};
const MUK_MISS=['틀렸네~ 먹물 충전♪','이유 없이 고르면, 그건 내 거야.','봐, 또 번졌잖아.','후후, 그 선지 나도 헷갈리게 만든 거야.'];
const ORP_BUG={
 1:['에, 에러?! 주인님, 제 소매가…… 픽셀로 깨지고 있어요!','앗, 앞치마 텍스처가 날아갔어요! 주인님, 보지 마세요오!'],
 2:['보, 보지 마세요! 렌더링 오류예요! 이건 버그예요, 버그!','의상 데이터 손실 61%…… 주, 주인님, 눈 감아 주세요!'],
 3:['시, 시스템 경고! 의상 데이터 손실 98%…… 주인님, 다음 문제는 꼭 맞혀 주세요오……!','머리띠랑 리본만 남았어요……! 이, 이건 메이드 스킨 최후의 보루예요!'],
};
const MUK_BUG=['네 주인님이 틀리니까 네가 번지는 거야♪','기록으로 만들어진 몸이잖아. 기록이 번지면, 너도 번져.','어머, 메이드 스킨이 다 깨졌네?'];
// 사연 배틀(종장 '사관의 시험'): 사관복은 연표 두루마리를 엮은 옷. 시대를 이어 맞힐수록 두루마리가 한 자락씩 풀려 연표가 된다(CG cg_sayeon_b0~b3).
const SAYEON_TAUNT=['이번엔 제가 묻겠습니다. 때와 곳, 이어 주실 수 있겠지요?','사관의 시험은 엄합니다. ……봐 드리지 않습니다.','처음 뵌 밤부터 지켜보았습니다. 이제 증명해 주십시오.'];
const SAYEON_BREAK={
 1:['……허리띠 두루마리가 풀렸군요. 괘, 괜찮습니다. 연표가 이어진 것이니까요.','한 자락 풀렸을 뿐입니다. 사관은 동요하지 않습니다.'],
 2:['자, 잠깐만요……! 겉옷까지 연표가 되어 버리면…… 주인님, 눈은 기록에만 두십시오!','어, 어깨가…… 이건 기록상 필요한 노출입니다. 그렇다고 해 두십시오!'],
 3:['~~~~~! 다 풀려 버렸습니다……! 연표는 이어졌지만, 저는…… 저는 무엇을 입으란 말입니까……!','보, 보지 마십시오……! 사관이 이런 꼴로 기록되면…… 기록되면……!'],
};
const SAYEON_MISS=['……그 답은 기록에 없습니다. 다시 읽으십시오.','때가 어긋났습니다. 사관의 눈은 속일 수 없습니다.','후후, 그 보기는 제가 일부러 놓아둔 것입니다.'];
const SAYEON_BUG=['주인님이 틀리시면, 오르페이아 님이 번집니다. 저와 같은 종이니까요.','오르페이아 님, 의상이…… 기록이 흐려지셨습니다.','제가 입을 옷을 지키려다 오르페이아 님 옷이 날아갔군요.'];
const OPP={
 muk:{name:'묵',sub:'먹물 계정',serSub:'번진 기록',cg:(st,b)=>mukCg(st,b),vsImg:b=>b.skin?mukCg(0,b):asset(b.serious?'st_muk_lonely.webp':'st_muk_smirk.webp'),vsCg:b=>!!b.skin,taunt:()=>MUK_TAUNT,brk:()=>MUK_BREAK,miss:()=>MUK_MISS,bug:()=>MUK_BUG,cloth:'먹물 옷',left:'먹물 옷 남은 겹',fin:'묵의 먹물 옷이 전부 벗겨졌다!',go:'첫 시도 정답 = BREAK! 먹물 옷을 한 겹씩 벗겨 내세요',counter:'묵의 반격',brkHead:'BREAK!',dmg:'-1 겹'},
 sayeon:{name:'사연',sub:'연표의 사관',serSub:'연표의 사관',cg:st=>asset(`cg_sayeon_b${st}.webp`),vsImg:()=>asset('cg_sayeon_b0.webp'),vsCg:()=>true,taunt:()=>SAYEON_TAUNT,brk:()=>SAYEON_BREAK,miss:()=>SAYEON_MISS,bug:()=>SAYEON_BUG,cloth:'두루마리 사관복',left:'남은 두루마리',fin:'사관복이 연표로 전부 풀려 나갔다!',go:'첫 시도 정답 = UNROLL! 두루마리 사관복을 한 자락씩 풀어 연표를 이으세요',counter:'사관의 반문',brkHead:'UNROLL!',dmg:'+1 연표'}};
const opp=b=>OPP[b?.who]||OPP.muk;
// ── 아군 사연(2단계 「잔향」): @battle muk stage2 ally=sayeon askin=<키>. 첫 시도 정답마다 사연의 시대 의상(두루마리로 엮은 옷)이 한 자락씩 풀려 묵을 묶는다.
//    CG cg_sayeon_<askin>_b0~b3(없으면 cg_sayeon_b0~b3), 의상 이름은 data/sayeon-skins.js.
const ALLY_SAYEON_GO=['2단계는 제가 서겠습니다. 주인님은 이유만 대 주십시오. 옷은…… 제가 내겠습니다.','잔향은 오래된 기록입니다. 사관의 소매로 묶겠습니다.','오르페이아 님은 쉬십시오. 이번 두루마리는 제 몫입니다.'];
const ALLY_SAYEON_BREAK={1:['한 자락 풀어 묵을 묶었습니다. ……소매가 조금 짧아졌을 뿐입니다.','두루마리 하나, 연표로 던졌습니다. 아직 괜찮습니다.'],2:['겉옷까지 연표로 썼습니다……! 주, 주인님, 눈은 묵 쪽으로!','어깨가 서늘하군요. 기록을 잇는 대가라면 감수하겠습니다……!'],3:['마지막 자락까지 다 던졌습니다……! 묵은 묶였지만, 저는…… 저를 기록하지 마십시오!','다 풀렸습니다……! 연표는 이어졌습니다. 그러니 제 꼴은 잊어 주십시오……!']};
const ALLY_SAYEON_MISS=['괜찮습니다. 묵의 먹물은 제가 소매로 막겠습니다. 다음 단서를 보십시오.','어긋났군요. 때와 곳부터 다시 잇지요.','그 보기는 다른 시대의 것입니다. 사관이 대신 기억해 두겠습니다.'];
const allyOn=b=>b?.ally==='sayeon';
function allyCg(st,b=S.battle){return asset(b?.askin?`cg_sayeon_${b.askin}_b${st}.webp`:`cg_sayeon_b${st}.webp`);}
const allyFb=st=>asset(`cg_sayeon_b${st}.webp`);
function askinName(b=S.battle){return window.SAYEON_SKINS?.[b?.askin]?.name||'';}
function recordAskin(b){if(!b?.askin)return;const m=records.sayeonSkins||(records.sayeonSkins={});m[b.askin]=Math.max(m[b.askin]??0,b.stage);save();}
const ORP_MISS=['주인님, 괜찮아요! 해설 보고 다시 가요!','으으, 먹물 튀었어요……! 다음엔 꼭이요!','방심했어요! 단서부터 다시 봐요!'];
const ORP_COMBO=['좋아요, 주인님! 그대로 밀어붙여요!','연속 정답! 묵이 흔들리고 있어요!','이 흐름이에요! 이유로 꿰뚫어요!'];
let lastBattle=null;
const pickOne=a=>a[Math.floor(Math.random()*a.length)];
const calm=()=>skip||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
// 의상(스킨)별 CG. 없으면 기본 cg_muk_bN.
function mukCg(st,b=S.battle){const k=b?.skin,n=b?.serious?0:st;return asset(k&&window.MUK_SKINS?.[k]?`cg_muk_${k}_b${n}.webp`:`cg_muk_b${n}.webp`);}
function battleImg(st){return opp(S.battle).cg(st,S.battle);}
function skinName(b=S.battle){return window.MUK_SKINS?.[b?.skin]?.name||'';}
function recordSkin(b){if(!b?.skin)return;const m=records.mukSkins||(records.mukSkins={});m[b.skin]=Math.max(m[b.skin]??0,b.serious?0:b.stage);save();}
function nextSkin(){const i=chapters.indexOf(curCh());for(const c of chapters.slice(i+1))for(const o of c.ops)if(o.t==='battle'&&/^muk\b/.test(o.arg)){const m=/(?:^|\s)skin=(\w+)/.exec(o.arg);if(m)return m[1];}return null;}   // 묵 배틀만(사연 배틀 skin=scroll은 묵 의상이 아니다)
function vnShake(big){if(calm())return;const v=$('#vn');v.classList.remove('vb-shake','vb-shake-big');void v.offsetWidth;v.classList.add(big?'vb-shake-big':'vb-shake');setTimeout(()=>v.classList.remove('vb-shake','vb-shake-big'),600);}
function particles(host,kind,n){if(calm())return;
 for(let i=0;i<n;i++){const e=document.createElement('i');e.className='vb-p '+kind;
  const ang=Math.random()*Math.PI*2,d=120+Math.random()*420;
  e.style.cssText=`left:${40+Math.random()*25}%;top:${30+Math.random()*30}%;--dx:${Math.cos(ang)*d}px;--dy:${Math.sin(ang)*d+(kind==='light'?-260:160)}px;--r:${Math.random()*720-360}deg;--s:${.5+Math.random()*1.1};animation-delay:${Math.random()*.15}s`;
  host.appendChild(e);}}
function battle(arg){
 const [who,mode]=arg.split(/\s+/);
 if(who==='end'){
  const b=S.battle;S.battle=null;lastBattle=b;$('#vnBattleHud')?.remove();if(!b){S.pc++;return step();}
  if(b.who==='muk')recordSkin(b);if(allyOn(b)){recordAskin(b);if(b.stage>0)S.sayeonDmg=b.stage;}
  if(b.who==='muk'&&!b.serious&&b.stage>0){S.mukDmg=b.stage;S.mukSkin=b.skin||null;}
  if(b.who==='sayeon'&&b.stage>0)S.sayeonDmg=b.stage;
  if(!b.serious&&b.orp>0)S.orpDmg=b.orp;
  if(skip){S.pc++;return step();}
  const rate=b.total?b.hits/b.total:0,rank=rate>=1?'S':rate>=.67?'A':rate>=.34?'B':'C';
  busy=true;SFX.play(rank==='S'?'vb_ko':'vb_end');
  const head=b.stage>=3?(b.serious?'정화 완료':'K.O.'):'BATTLE END';
  const el=battleCut(head,b.stage>=3?(b.serious?'번진 기록이 모두 빛으로 돌아갔다.':opp(b).fin):(b.serious?`아직 번진 기록 ${3-b.stage}`:`${opp(b).left} ${3-b.stage}`),b.stage,b.serious,true);
  el.classList.add('result');
  el.querySelector('.vb-text').insertAdjacentHTML('beforeend',`<div class="vb-rank r-${rank}">${rank==='S'?`<img src="${asset('emblem_gold.webp')}" alt="">`:''}<span>RANK</span><b>${rank}</b></div><ul class="vb-stats"><li>첫 시도 정답 <b>${b.hits}/${b.total||0}</b></li><li>최대 콤보 <b>${b.maxCombo||0}</b></li><li>${b.serious?'되돌린 기록':'BREAK'} <b>${b.stage}/3</b></li>${allyOn(b)?`<li>사연 두루마리 <b>${b.stage}/3</b></li>`:b.serious?'':`<li>오르페이아 버그 <b>${b.orp}/3</b></li>`}</ul>`);
  el.onclick=e=>{e.stopPropagation();el.remove();
   // 이 장의 마지막 배틀이면 다음 장 묵의 새 의상을 실루엣으로 예고
   const more=curCh().ops.slice(S.pc+1).some(o=>o.t==='battle'&&!/^end/.test(o.arg));const nk=!more&&b.who==='muk'&&nextSkin();
   if(nk&&window.MUK_SKINS?.[nk]){const t=document.createElement('div');t.className='vn-next';const sk=window.MUK_SKINS[nk];
    t.innerHTML=`<small>NEXT BATTLE</small><div class="vn-next-sil"><img src="${asset(`cg_muk_${nk}_b0.webp`)}" alt=""></div><b>다음 장의 묵</b><p>「${esc(sk.name)}」</p><em>${sk.serious?'다음 기록은, 조용히 마주해야 해요.':'다음엔 이 옷이에요. 벗겨 낼 수 있을까요?'}</em><span>눌러서 계속 ▶</span>`;
    $('#vn').appendChild(t);SFX.play('vb_bell');t.onclick=ev=>{ev.stopPropagation();t.remove();busy=false;S.pc++;step();};return;}
   busy=false;S.pc++;step();};return;
 }
 const st2=/stage2/.test(arg),skin=(/skin=(\w+)/.exec(arg)||[])[1]||null;S.battle={who,skin,serious:/serious/.test(arg),stage2:st2,ally:(/ally=(\w+)/.exec(arg)||[])[1]||null,askin:(/askin=(\w+)/.exec(arg)||[])[1]||null,stage:0,orp:0,hits:0,total:0,combo:0,maxCombo:0};
 if(skip){S.pc++;return step();}
 busy=true;BGM.play(S.battle.serious?'bgm_tragic':S.battle.who==='sayeon'?'bgm_sayeon':'bgm_challenge');
 const v=$('#vn'),el=document.createElement('div');el.className='vn-vs'+(S.battle.serious?' serious':'');
 el.innerHTML=(allyOn(S.battle)?`<div class="vs-side vs-l cg"><img class="vs-emblem" src="${asset('emblem_white.webp')}" alt=""><img src="${allyCg(0)}" onerror="this.onerror=null;this.src='${allyFb(0)}'" alt=""><b>사연</b><small>${askinName()?esc(askinName())+' · ':''}연표의 사관</small></div>`:`<div class="vs-side vs-l"><img class="vs-emblem" src="${asset('emblem_white.webp')}" alt=""><img src="${asset('st_orpheia_serious.webp')}" alt=""><b>오르페이아</b><small>電脳侍女 · LV.99</small></div>`)+`
 <div class="vs-side vs-r${opp(S.battle).vsCg(S.battle)?' cg':''}"><img src="${opp(S.battle).vsImg(S.battle)}" alt=""><b>${opp(S.battle).name}</b><small>${S.battle.who==='muk'&&skinName()?esc(skinName())+' · ':''}${S.battle.serious?opp(S.battle).serSub:opp(S.battle).sub}</small></div>
 <div class="vs-mark">${S.battle.serious?'鎭魂':'VS'}</div>${S.battle.stage2?'<div class="vs-stage">STAGE 2 · 잔향</div>':''}<div class="vs-bar top"></div><div class="vs-bar bot"></div>
 <p class="vs-line">${esc(allyOn(S.battle)?'사연「'+pickOne(ALLY_SAYEON_GO)+'」':S.battle.serious?'……이 이름들, 이유와 함께 돌려줘.':opp(S.battle).name+'「'+pickOne(opp(S.battle).taunt())+'」')}</p>
 <p class="vs-go">${allyOn(S.battle)?'첫 시도 정답 = UNROLL! 사연의 두루마리 의상을 한 자락씩 풀어 묵을 묶으세요':S.battle.serious?'첫 시도에 맞혀서, 번진 기록을 되돌려 주세요':opp(S.battle).go}<small>눌러서 시작 ▶</small></p>`;
 v.appendChild(el);SFX.play(S.battle.serious?'vb_bell':'vb_start');if(!S.battle.serious)vnShake(true);
 el.onclick=e=>{e.stopPropagation();if(el.dataset.go)return;el.dataset.go='1';el.classList.add('out');SFX.play('vb_go');setTimeout(()=>{el.remove();busy=false;S.pc++;step();},280);};
}
function battleCut(head,text,st,serious,wait){
 const v=$('#vn');const el=document.createElement('div');el.className='vn-battle'+(serious?' serious':'')+(wait?' wait':'');
 el.innerHTML=`<img src="${opp(S.battle||lastBattle).cg(st,S.battle||lastBattle)}" alt=""><div class="vb-text"><b>${esc(head)}</b><p>${esc(text)}</p>${wait?'<small>눌러서 계속 ▶</small>':''}</div>`;
 v.appendChild(el);return el;
}
function battleHud(){
 $('#vnBattleHud')?.remove();const b=S.battle,w=document.createElement('div');w.id='vnBattleHud';w.className='vbh-wrap'+(b.serious?' serious':'');
 // 한 줄 대전 막대: 왼쪽 상대(묵·사연) · 가운데 VS · 오른쪽 내 편(오르페이아 / 아군 사연). 막대+칸을 겹 3칸 하나로 합쳤다.
 const seg=(lost,prev)=>`<span class="vbh-seg">${[1,2,3].map(i=>`<i class="${i<=lost?(i>(prev??lost)?'off hit':'off'):''}"></i>`).join('')}</span>`;
 const side=(cls,img,stand,name,sub,lost,prev,note,fb)=>`<div class="vbh-side ${cls}"><span class="vbh-face${stand?' stand':''}"><img src="${img}"${fb?` onerror="this.onerror=null;this.src='${fb}'"`:''} alt=""></span><div class="vbh-info"><b>${name}<small>${sub}</small></b>${seg(lost,prev)}<em>${note}</em></div></div>`;
 const foeFace=b.who==='muk'?(b.serious?'st_muk_lonely.webp':b.stage===0?'st_muk_smirk.webp':(b.skin&&window.MUK_SKINS?.[b.skin]?.dmg)?`st_muk_${b.skin}_${b.stage===1?'angry':'shy'}_d${b.stage}.webp`:`st_muk_${b.stage===1?'angry':'shy'}_d${b.stage}.webp`):'st_sayeon_serious.webp';
 const foe=side('foe',asset(foeFace),true,opp(b).name,b.serious?'번진 기록':opp(b).cloth,b.stage,b.lagStage,b.serious?'':`남은 겹 ${3-b.stage}/3`);
 const mine=allyOn(b)?side('mine ally',asset('st_sayeon_smile.webp'),true,'사연',(askinName(b)?esc(askinName(b))+' · ':'')+'두루마리',b.stage,b.lagStage,'정답마다 묵을 묶어요')
  :b.serious?'':side('mine',asset(b.orp?`st_orpheia_shy_g${b.orp}.webp`:'st_orpheia_serious.webp'),true,'오르페이아','의상 데이터',b.orp,b.lagOrp,b.orp?`손실 ${b.orp}/3`:'오답이면 버그!');
 w.innerHTML=foe+`<span class="vbh-vs">VS</span>`+mine+(b.combo>1?`<em class="vbh-combo">${b.combo} COMBO</em>`:'');
 $('#vn').appendChild(w);b.lagStage=b.stage;b.lagOrp=b.orp;
}
function battleHit(ok,first,hits,total){
 const b=S.battle;if(!b)return;b.total=total;b.hits=hits;
 if(ok&&!first){battleHud();return;}
 if(!ok&&!b.serious&&!allyOn(b)&&b.orp<3){b.combo=0;b.orp++;const n=b.orp;SFX.play('vb_glitch');vnShake(n>=3);
  const el=document.createElement('div');el.className='vn-battle bug'+(n>=3?' fin':'');const src=asset(`cg_orp_b${n}.webp`);
  el.innerHTML=`<img class="base" src="${src}" alt=""><img class="rgb r" src="${src}" alt=""><img class="rgb c" src="${src}" alt=""><div class="vb-scan"></div><div class="vb-err">ERROR 0x${(0xC0+n*7).toString(16).toUpperCase()} · COSTUME_DATA ${[0,23,61,98][n]}% LOST</div><div class="vb-text"><b>${n>=3?'SYSTEM DOWN':'BUG!'}</b><p>오르페이아「${esc(pickOne(ORP_BUG[n]))}」</p><p class="vb-muk">${opp(b).name}「${esc(pickOne(opp(b).bug()))}」</p></div>`;
  $('#vn').appendChild(el);seeCg(src);particles(el,'pixel',n>=3?36:22);el.onclick=e=>{e.stopPropagation();el.remove();};setTimeout(()=>el.remove(),n>=3?3400:2700);battleHud();return;}
 if(!ok){b.combo=0;SFX.play('vb_ink');vnShake(false);
  const m=battleCut(opp(b).counter,`${opp(b).name}「${pickOne(opp(b).miss())}」`,b.stage,b.serious,false);m.classList.add('miss');particles(m,'ink',18);
  m.querySelector('.vb-text').insertAdjacentHTML('beforeend',allyOn(b)?`<p class="vb-orp">사연「${esc(pickOne(ALLY_SAYEON_MISS))}」</p>`:`<p class="vb-orp">오르페이아「${esc(pickOne(ORP_MISS))}」</p>`);
  sdPop('cry');setTimeout(()=>m.remove(),1700);battleHud();return;}
 b.combo++;b.maxCombo=Math.max(b.maxCombo,b.combo);
 const st=Math.min(3,Math.ceil(3*hits/Math.max(1,total)));
 if(st<=b.stage){battleHud();if(b.combo>1){SFX.play('vb_combo');sdPop('cheer');}return;}
 const prev=b.stage;b.stage=st;const fin=st>=3;
 if(b.serious){SFX.play('vb_purify');}else{SFX.play(fin?'vb_finish':'vb_break');setTimeout(()=>SFX.play('vb_rip'),fin?260:140);vnShake(fin);}
 const el=document.createElement('div');el.className='vn-battle hit'+(b.serious?' serious':'')+(fin?' fin':'');
 const [head,line]=allyOn(b)?[fin?'FINISH!':'UNROLL!',`사연「${pickOne(ALLY_SAYEON_BREAK[st])}」`]:b.serious?['정화',MUK_SERIOUS[st]]:[fin?'FINISH!':opp(b).brkHead,`${opp(b).name}「${pickOne(opp(b).brk()[st])}」`];
 const sub=allyOn(b)?`<p class="vb-muk">${b.serious?esc(MUK_SERIOUS[st]):'묵「'+esc(pickOne(opp(b).brk()[st]))+'」'}</p>`:'';
 el.innerHTML=(allyOn(b)?`<img class="old" src="${allyCg(prev,b)}" onerror="this.onerror=null;this.src='${allyFb(prev)}'" alt=""><img class="new" src="${allyCg(st,b)}" onerror="this.onerror=null;this.src='${allyFb(st)}'" alt="">`:`<img class="old" src="${opp(b).cg(prev,b)}" alt=""><img class="new" src="${opp(b).cg(st,b)}" alt="">`)+`<div class="vb-slash"></div><div class="vb-text"><b>${head}</b><p>${esc(line)}</p>${sub}${b.combo>1?`<p class="vb-orp">${b.combo} COMBO · ${allyOn(b)?'오르페이아「사연 님, 그대로예요!」':'오르페이아「'+esc(pickOne(ORP_COMBO))+'」'}</p>`:''}</div><span class="vb-dmg">${allyOn(b)?'+1 연표':b.serious?'+1 기록':opp(b).dmg}</span>`;
 $('#vn').appendChild(el);seeCg(allyOn(b)?allyCg(st,b):opp(b).cg(st,b));particles(el,b.serious?'light':'cloth',b.serious?26:fin?40:24);if(!b.serious)particles(el,'ink',10);
 el.onclick=e=>{e.stopPropagation();el.remove();};setTimeout(()=>el.remove(),fin?3400:2700);battleHud();
}

function finishChapter(next){
 if(curCh().side){busy=true;S.line=null;paint();const c=$('#vnCard');c._tok=(c._tok||0)+1;c.onclick=null;c.className='vn-card chapter';c.hidden=false;$('#vnBox').classList.add('quiet');
  c.innerHTML=`<img class="vn-crest end" src="${asset('emblem_gold.webp')}" alt=""><small>SIDE STORY · END</small><h2>${esc(curCh().subtitle||curCh().title)}</h2><p>본편과 상관없는 어느 하루였어요. ……아마도요.</p><button class="primary">타이틀로</button>`;
  c.querySelector('button').onclick=e=>{e.stopPropagation();busy=false;title();};return;}
 const i=chapters.indexOf(curCh()),nx=next?byId[next]:chapters[i+1];meta.flags={...S.flags};persist();
 if(nx){reach(nx.id);S={...fresh(nx.id),flags:S.flags,day:S.day,phone:S.phone};autosave('장 시작');paint();return step();}
 busy=true;S.line=null;paint();const c=$('#vnCard');c._tok=(c._tok||0)+1;c.onclick=null;c.className='vn-card chapter';c.hidden=false;$('#vnBox').classList.add('quiet');
 const done=curCh().id==='ep';c.innerHTML=done?`<img class="vn-crest end" src="${asset('emblem_gold.webp')}" alt=""><small>THE END${S.ending?` · ${esc(S.ending.t)}`:''}</small><h2>연표의 끝에서</h2>${S.ending?.d?`<p><b>${esc(S.ending.d)}</b></p>`:''}<p>본 엔딩 ${(records.endings||[]).length}/${endingCount()}. 선사부터 오늘까지, 주인님과 함께 걸었어요. 이야기 속에서 처음 맞힌 기출 ${S.flags.quizAll||0}문항. 틀린 문제는 오답 노트에서 묵이 기다리고 있어요. 타이틀의 「기출 풀기」에서 언제든 다시 읽어 주세요.</p><button class="primary">타이틀로</button>`:`<small>TO BE CONTINUED</small><h2>다음 시대는 준비 중이에요</h2><p>주인님, 여기까지 함께해 주셔서 고마워요. 타이틀의 「기출 풀기」에서 550문항을 언제든 다시 풀 수 있어요.</p><button class="primary">타이틀로</button>`;
 c.querySelector('button').onclick=e=>{e.stopPropagation();busy=false;title();};
}

// ── 세이브·로드(오토·퀵).
function snapshot(label){return {state:JSON.parse(JSON.stringify(S)),log:log.slice(-60),time:Date.now(),label:label||'',chapter:`${curCh().title} · ${curCh().subtitle}`};}
function autosave(label){if(!S)return;meta.saves.auto=snapshot(label);persist();}
function saveTo(slot){if(!S||!S.line){toast('대사가 보일 때 저장할 수 있어요.');return;}meta.saves[slot]=snapshot();persist();SFX.play('save');toast('퀵 세이브 완료');}
function loadFrom(slot){const s=meta.saves[slot];if(!s||!byId[s.state.ch]){toast('불러올 기록이 없어요.');return;}
 Quiz.close();S=JSON.parse(JSON.stringify(s.state));log=s.log||[];BGM.scene(S.bg);busy=false;skip=false;auto=false;setHidden(false);closeDialogs();shell();
 const line=S.line;S.line=null;paint();if(line){S.line=line;paint();type();}else step();}
function latest(){return Object.entries(meta.saves).sort((a,b)=>b[1].time-a[1].time)[0]?.[0];}
function openLog(){if(!S)return;const d=$('#vnLog');d.innerHTML=`<div class="dialog-header"><div><small>BACKLOG</small><h2>지난 대사</h2></div><button class="quiet" data-close>닫기 ×</button></div><div class="vn-log">${log.map(l=>`<p>${l.who?`<b>${esc(l.who)}</b>`:''}${esc(l.text)}</p>`).join('')||'<p>아직 기록이 없어요.</p>'}</div>`;d.querySelector('[data-close]').onclick=()=>d.close();d.showModal();const box=d.querySelector('.vn-log');box.scrollTop=box.scrollHeight;}
function config(){const d=$('#vnConfig'),st=meta.settings;
 d.innerHTML=`<div class="dialog-header"><div><small>CONFIG</small><h2>설정</h2></div><button class="quiet" data-close>닫기 ×</button></div><div class="vn-config">
 <label>대사 속도<select id="cfgText">${[[45,'여유롭게'],[28,'보통'],[16,'빠르게'],[0,'즉시 표시']].map(([v,n])=>`<option value="${v}" ${records.textSpeed===v?'selected':''}>${n}</option>`).join('')}</select></label>
 <label>오토 대기<select id="cfgAuto">${[[2600,'느리게'],[1600,'보통'],[800,'빠르게']].map(([v,n])=>`<option value="${v}" ${st.auto===v?'selected':''}>${n}</option>`).join('')}</select></label>
 <label>음악 볼륨<input type="range" id="cfgBgm" min="0" max="100" value="${Math.round(BGM.settings().volume*100)}"></label>
 <label>효과음 볼륨<input type="range" id="cfgSfx" min="0" max="100" value="${Math.round(SFX.settings().volume*100)}"></label>
 <label class="check"><input type="checkbox" id="cfgMute" ${BGM.settings().muted?'checked':''}> 음악 끄기</label>
 <label class="check"><input type="checkbox" id="cfgBlip" ${SFX.settings().blip!==false?'checked':''}> 대사 타이핑 소리</label>
 <label class="check"><input type="checkbox" id="cfgPreNote" ${records.preNote!==false?'checked':''}> 문제 풀기 전 단서 노트 보이기</label>
 <button class="quiet" id="cfgReset">이야기 진행 기록 초기화</button></div>`;
 d.querySelector('[data-close]').onclick=()=>d.close();
 $('#cfgText').onchange=e=>{records.textSpeed=+e.target.value;save();};$('#cfgAuto').onchange=e=>{st.auto=+e.target.value;persist();};$('#cfgBgm').oninput=e=>BGM.setVolume(+e.target.value/100);$('#cfgMute').onchange=e=>BGM.setMuted(e.target.checked);$('#cfgSfx').oninput=e=>SFX.setVolume(+e.target.value/100);$('#cfgBlip').onchange=e=>SFX.setBlip(e.target.checked);$('#cfgPreNote').onchange=e=>{records.preNote=e.target.checked;save();};
 $('#cfgReset').onclick=()=>{if(!confirm('세이브·읽음 기록을 지울까요? 문항 풀이 기록은 남습니다.'))return;meta={saves:{},read:{},flags:{},settings:st};persist();d.close();title();};
 d.showModal();
}
// 묵 의상 도감: 배틀에서 만난 의상과 벗겨 낸 단계까지의 CG. 못 본 의상은 실루엣.
function mukGallery(){const d=$('#vnLog'),got=records.mukSkins||{},all=Object.entries(window.MUK_SKINS||{});
 const n=all.filter(([k])=>k in got).length;
 d.innerHTML=`<div class="dialog-header"><div><small>COLLECTION</small><h2>묵 의상 도감</h2></div><button class="quiet" data-close>닫기 ×</button></div>
 <p class="mg-sum">만난 의상 ${n} / ${all.length} · 첫 시도 정답으로 먹물 옷을 벗겨 낸 단계까지 열려요.</p><div class="mg-grid">${all.map(([k,v])=>{const has=k in got,mx=has?got[k]:-1,st=v.serious?[0]:[0,1,2,3];
  return `<figure class="mg-card${has?'':' locked'}${v.serious?' serious':''}"><div class="mg-main"><img src="${asset(`cg_muk_${k}_b0.webp`)}" alt=""></div><figcaption><b>${has?esc(v.name):'???'}</b>${v.serious?'<small>진혼</small>':`<span class="mg-pips">${st.map(i=>`<i class="${i<=mx?'on':''}" data-k="${k}" data-i="${i}"></i>`).join('')}</span>`}</figcaption></figure>`;}).join('')}</div><div class="mg-view" hidden><img alt=""></div>`;
 d.querySelector('[data-close]').onclick=()=>d.close();
 const view=d.querySelector('.mg-view');view.onclick=()=>view.hidden=true;
 d.querySelectorAll('.mg-card:not(.locked) .mg-main').forEach(m=>m.onclick=()=>{view.querySelector('img').src=m.querySelector('img').src;view.hidden=false;});
 d.querySelectorAll('.mg-pips i.on').forEach(p=>p.onclick=e=>{e.stopPropagation();view.querySelector('img').src=asset(`cg_muk_${p.dataset.k}_b${p.dataset.i}.webp`);view.hidden=false;});
 d.showModal();}
// ── 갤러리: 본 CG·들은 곡·본 엔딩만 열린다(records.cgSeen / records.bgmHeard / records.endings).
function seeCg(src){const k=String(src||'').split('/').pop().replace(/\.(webp|png)(\?.*)?$/,'');if(!/^cg_/.test(k)||/^cg_(ink_spread|comment_flame)$/.test(k))return;const a=records.cgSeen||(records.cgSeen=[]);if(!a.includes(k)){a.push(k);save();}}
BGM.onplay=n=>{if(!n||n==='bgm_title')return;const a=records.bgmHeard||(records.bgmHeard=[]);if(!a.includes(n)){a.push(n);save();}};
const SONG_TITLE={song_ch01:'돌덩이 러브레터',song_ch02:'다섯 나라 페스티벌',song_ch03:'한강의 깃발',song_ch04:'칠십 년의 전쟁',song_ch05:'바다 건너 등주로',song_ch06:'천 년의 저녁',song_ch07:'왕들의 배틀',song_ch08:'칼과 말발굽',song_ch09:'여울 상단',song_ch10:'상순이의 궁궐',song_ch11:'격군의 노래',song_ch12:'상복 3년 대 1년',song_ch13:'장터의 노래',song_ch14:'하늘은 안 없어져요',song_ch15:'전차가 달리는 거리',song_ch16:'빼앗길 때마다',song_ch17:'만세의 봄',song_ch18:'여러 갈래의 길',song_ch19:'경성 시티팝',song_ch20:'광복의 새벽',song_ch21:'천막 교실의 노래',song_ch22:'4월의 교복, 6월의 거리',song_ch23:'선을 넘는 걸음',song_ep:'연표 (앨범 타이틀곡)',song_end_orpheia:'이유와 함께',song_end_fail:'노래는 남았다',song_end_hero:'한 줄을 남기고',song_end_muk:'이번엔 틀린 거 말고'};
const BGM_TITLE={bgm_title:'타이틀',bgm_daily:'작업실 낮',bgm_night_shift:'새벽 세 시의 작업실',bgm_outing:'연표 다이브',bgm_orpheia:'오르페이아 테마',bgm_exam:'기출 풀기',bgm_result:'발매 정산',bgm_challenge:'먹물과의 배틀',bgm_comedy:'러브코미디 사건',bgm_romance:'설렘',bgm_tragic:'비극의 현장',bgm_yunseul:'윤슬 테마',bgm_ending:'전원 집합',bgm_sayeon:'사관의 시험',bgm_jealous:'질투 소동',bgm_horror:'남겨진 밤',bgm_exorcist:'야간 근무',bgm_babies:'고모의 육아지옥',bgm_family:'오늘을 산다',bgm_noble:'담장 너머 아가씨',bgm_clinic:'도담의 진료소',bgm_tension:'긴장',bgm_muk:'묵 테마',bgm_era_ancient:'연표 다이브 · 고대',bgm_era_goryeo:'연표 다이브 · 고려',bgm_era_joseon:'연표 다이브 · 조선 전기',bgm_era_joseon_late:'연표 다이브 · 조선 후기',bgm_era_modern:'연표 다이브 · 개항기',bgm_era_colonial:'연표 다이브 · 일제 강점기',bgm_era_contemporary:'연표 다이브 · 현대'};
function galleryCgs(){
 const groups=[],seen=new Set();
 for(const c of [...chapters,...sides]){const list=[];for(const o of c.ops){const ks=o.t==='bg'?[o.arg.split('|')[0].trim()]:o.t==='cutin'?(CUTIN_ALL[o.arg.trim()]||[CUTIN[o.arg.trim()]?CUTIN[o.arg.trim()]():o.arg.trim()]):[];for(const k of ks)if(/^cg_/.test(k)&&!/^cg_(ink_spread|comment_flame)$/.test(k)&&!seen.has(k)){seen.add(k);list.push(k);}}if(list.length)groups.push({t:c.side?`${c.title} · ${c.subtitle}`:c.title,list});}
 const battle=['cg_orp_b1','cg_orp_b2','cg_orp_b3','cg_sayeon_b0','cg_sayeon_b1','cg_sayeon_b2','cg_sayeon_b3'];
 for(const k of Object.keys(window.SAYEON_SKINS||{}))for(let i=0;i<4;i++)battle.push(`cg_sayeon_${k}_b${i}`);
 groups.push({t:'배틀 — 오르페이아·사연',list:battle.filter(k=>!seen.has(k))});
 return groups;
}
const OLD_CGS=["cg_ch02_noeul_h1","cg_ch02_dallae_h1","cg_ch02_dallae_h2","cg_ch03_eunsil_h1","cg_ch03_naru_h1","cg_ch03_irang_h1","cg_ch04_gaon_h1","cg_ch04_ara_h1","cg_ch05_haerang_h1","cg_ch05_ullim_h1","cg_ch05_haerang_h2","cg_ch06_naru_h1","cg_ch06_sara_h1","cg_ch06_haneui_h1","cg_ch07_maru_h1","cg_ch07_seori_h1","cg_muk_goryeo_d1","cg_muk_goryeo_d3","cg_ch08_soebyeol_h1","cg_ch08_danbi_h1","cg_muk_general_d1","cg_muk_general_d3","cg_ch09_yeoul_h1","cg_ch10_sodam_h1","cg_muk_yeogwan_d1","cg_ch10_goyo_h1","cg_muk_yeogwan_d3","cg_ch11_dodam_h1","cg_ch11_tsubaki_h1","cg_muk_lotus_d1","cg_muk_lotus_d3","cg_ch11_naru_h1","cg_ch12_maehyang_h1","cg_ch12_choryeon_h1","cg_ch12_hwaseon_h1","cg_ch12_seola_h1","cg_ch12_choa_h1","cg_muk_rain_d1","cg_muk_rain_d3","cg_ch13_bada_h1","cg_muk_talchum_d1","cg_muk_talchum_d3","cg_ch13_dano_h1","cg_ch14_garam_h1","cg_ch14_sodam_h1","cg_muk_donghak_d1","cg_muk_donghak_d3","cg_ch14_bori_h1","cg_ch15_goyo_h1","cg_ch15_ellie_h1","cg_muk_modern1900_d1","cg_muk_modern1900_d3","cg_ch16_hanbyeol_h1","cg_muk_uibyeong_d1","cg_muk_uibyeong_d3","cg_ch17_chunmei_h1","cg_muk_manse_d1","cg_muk_manse_d3","cg_ch18_bori_h1","cg_muk_moga_d1","cg_muk_moga_d3","cg_ch19_hanbyeol_h1","cg_muk_hangul_d1","cg_muk_hangul_d3","cg_ch20_chunmei_h1","cg_ch20_saebyeok_h1","cg_muk_liberation_d1","cg_muk_liberation_d3","cg_muk_refugee_d1","cg_muk_refugee_d3","cg_ch22_bomnae_h1","cg_muk_handkerchief_d1","cg_muk_handkerchief_d3","cg_ch23_saebyeok_h1","cg_ch23_moa_h1","cg_muk_idol_d1","cg_muk_idol_d3","cg_ch23_dasom_h1","cg_ep_sayeon_scroll_break","cg_ep_muk_pages_break","cg_end_dodam_h1","cg_end_ara_h1","cg_end_gaon_h1","cg_end_maru_h1","cg_end_seori_h1","cg_end_soebyeol_h1","cg_end_danbi_h1","cg_end_bomnae_h1","cg_end_haneui_h1","cg_end_yeoul_h1","cg_end_naru_h1","cg_end_sodam_h1","cg_end_maehyang_h1","cg_end_choryeon_h1","cg_end_hwaseon_h1","cg_end_seola_h1","cg_end_hanbyeol_h1","cg_end_bori_h1","cg_end_dano_h1","cg_end_haerang_h1","cg_end_garam_h1","cg_end_ullim_h1","cg_end_noeul_h1","cg_end_dallae_h1","cg_end_saebyeok_h1","cg_end_dasom_h1","cg_end_irang_h1","cg_end_eunsil_h1","cg_end_sara_h1","cg_end_choa_h1","cg_end_bada_h1","cg_end_ellie_h1","cg_end_goyo_h1","cg_end_moa_h1","cg_end_tsubaki_h1","cg_end_chunmei_h1","cg_end_orpheia_h1","cg_end_muk_h1","cg_sp03_saebyeok_h1","cg_sp04_ellie_h1","cg_sp05_noeul_h1","cg_sp05_dallae_h1","cg_sp05_irang_h1","cg_sp05_eunsil_h1","cg_sp05_naru_h1","cg_sp05_ara_h1","cg_sp05_gaon_h1","cg_sp05_haerang_h1","cg_sp05_ullim_h1","cg_sp05_sara_h1","cg_sp05_haneui_h1","cg_sp05_maru_h1","cg_sp05_seori_h1","cg_sp05_yeoul_h1","cg_sp05_soebyeol_h1","cg_sp05_danbi_h1","cg_sp05_sodam_h1","cg_sp05_goyo_h1","cg_sp05_dodam_h1","cg_sp05_tsubaki_h1","cg_sp05_maehyang_h1","cg_sp05_seola_h1","cg_sp05_hwaseon_h1","cg_sp05_choryeon_h1","cg_sp05_choa_h1","cg_sp05_dano_h1","cg_sp05_bada_h1","cg_sp05_garam_h1","cg_sp05_bori_h1","cg_sp05_ellie_h1","cg_sp05_hanbyeol_h1","cg_sp05_chunmei_h1","cg_sp05_saebyeok_h1","cg_sp05_bomnae_h1","cg_sp05_dasom_h1","cg_sp05_moa_h1","cg_sp05_orpheia_h1","cg_sp06_saebyeok_h1","cg_sp06_noeul_h1","cg_sp06_ullim_h1","cg_sp06_dallae_h1","cg_sp06_naru_h1","cg_sp06_irang_h1","cg_sp06_eunsil_h1","cg_sp06_ara_h1","cg_sp06_gaon_h1","cg_sp06_haerang_h1","cg_sp06_sara_h1","cg_sp06_haneui_h1","cg_sp06_maru_h1","cg_sp06_seori_h1","cg_sp06_yeoul_h1","cg_sp06_soebyeol_h1","cg_sp06_danbi_h1","cg_sp06_sodam_h1","cg_sp06_goyo_h1","cg_sp06_dodam_h1","cg_sp06_tsubaki_h1","cg_sp06_maehyang_h1","cg_sp06_choryeon_h1","cg_sp06_hwaseon_h1","cg_sp06_seola_h1","cg_sp06_choa_h1","cg_sp06_dano_h1","cg_sp06_bada_h1","cg_sp06_garam_h1","cg_sp06_bori_h1","cg_sp06_ellie_h1","cg_sp06_hanbyeol_h1","cg_sp06_chunmei_h1","cg_sp06_bomnae_h1","cg_sp06_dasom_h1","cg_sp06_moa_h1","cg_sp06_orpheia_h1"];
function gallery(tab='cg'){
 const d=$('#vnLog');d.className='sheets gallery';const got=new Set(records.cgSeen||[]),heard=new Set(records.bgmHeard||[]),ends=records.endings||[];
 const groups=galleryCgs(),total=groups.reduce((n,g)=>n+g.list.length,0),opened=groups.reduce((n,g)=>n+g.list.filter(k=>got.has(k)).length,0);
 const songs=[...BGM.songs,'song_end_orpheia','song_end_fail','song_end_hero','song_end_muk'],bgms=Object.keys(BGM_TITLE);
 const oldOpened=OLD_CGS.filter(k=>got.has(k)).length;
 const tabs=`<nav class="gl-tabs">${[['cg',`CG ${opened}/${total}`],['old',`(구)CG ${oldOpened}/${OLD_CGS.length}`],['music',`음악 감상 ${[...songs,...bgms].filter(n=>heard.has(n)||n==='bgm_title').length}/${songs.length+bgms.length}`],['scene',`회상 ${sceneList().filter(x=>got.has(x.k)).length}/${sceneList().length}`],['end',`엔딩 ${ends.length}/${endingCount()}`],['muk','묵 의상 도감']].map(([k,v])=>`<button data-tab="${k}" class="${k===tab?'on':''}">${v}</button>`).join('')}</nav>`;
 let body='';
 if(tab==='cg')body=groups.map(g=>{const sets=[];for(const k of g.list){const b=varBase(k),last=sets[sets.length-1];if(last&&last.b===b)last.v.push(k);else sets.push({b,v:[k]});}
  return `<h3 class="gl-h">${esc(g.t)}</h3><div class="mg-grid">${sets.map(st=>{const own=st.v.filter(k=>got.has(k));return `<figure class="mg-card${own.length?'':' locked'}"><div class="mg-main" data-set="${own.join(',')}">${own.length?`<img loading="lazy" src="${asset(own[0]+'.webp')}" alt="">`:'<span class="gl-lock">?</span>'}</div>${st.v.length>1?`<figcaption><small>차분</small><b>${own.length} / ${st.v.length}</b></figcaption>`:''}</figure>`;}).join('')}</div>`;}).join('');
 if(tab==='old'){const oldSet=new Set(OLD_CGS);body=`<p class="mg-sum">교정 전 초기 버전 (구)CG 보관함입니다. 본편에서 해당 장면을 보면 함께 열립니다.</p>`+groups.map(g=>{const xs=g.list.filter(k=>oldSet.has(k));return xs.length?`<h3 class="gl-h">${esc(g.t)}</h3><div class="mg-grid">${xs.map(k=>{const on=got.has(k);return `<figure class="mg-card${on?'':' locked'}"><div class="mg-main" ${on?`data-set="${k}_old"`:''}>${on?`<img loading="lazy" src="${asset(k+'_old.webp')}" alt="">`:'<span class="gl-lock">?</span>'}</div><figcaption><small>(구)CG</small><b>${esc(k.replace(/^cg_/,'').replace(/_h\d$/,''))}</b></figcaption></figure>`;}).join('')}</div>`:'';}).join('');}
 if(tab==='scene'){const L=sceneList();body=`<p class="mg-sum">본 장면을 그 CG가 뜨는 곳부터 다시 봐요. 장면이 끝나면 여기로 돌아와요.</p>`+[...chapters,...sides].map(c=>{const xs=L.filter(x=>x.ch===c.id);return xs.length?`<h3 class="gl-h">${esc(c.side?`${c.title} · ${c.subtitle}`:c.title)}</h3><div class="mg-grid">${xs.map(x=>`<figure class="mg-card${got.has(x.k)?'':' locked'}"><div class="mg-main gl-replay" data-rp="${got.has(x.k)?L.indexOf(x):''}">${got.has(x.k)?`<img loading="lazy" src="${asset(x.k+'.webp')}" alt=""><span class="gl-play">▶ 회상</span>`:'<span class="gl-lock">?</span>'}</div></figure>`).join('')}</div>`:'';}).join('');}
 if(tab==='music'){const row=(n,t)=>{const on=heard.has(n)||n==='bgm_title';return `<li class="${on?'':'locked'}"><button data-play="${n}" ${on?'':'disabled'}>▶</button><span>${on?esc(t):'？？？'}</span><small>${n.startsWith('song_ch')?'TRACK '+n.slice(-2):''}</small></li>`;};
  body=`<p class="mg-sum">이야기에서 한 번 들은 곡이 열려요. 다시 누르면 멈춰요.</p><h3 class="gl-h">노래</h3><ul class="gl-music">${songs.map(n=>row(n,SONG_TITLE[n]||n)).join('')}</ul><h3 class="gl-h">배경 음악</h3><ul class="gl-music">${bgms.map(n=>row(n,BGM_TITLE[n])).join('')}</ul>`;}
 if(tab==='end')body=`<p class="mg-sum">본 엔딩 ${ends.length} / ${endingCount()}</p><ul class="gl-end">${ends.map(e=>`<li>✦ ${esc(typeof e==='string'?e:e.t||'')}</li>`).join('')||'<li class="locked">아직 본 엔딩이 없어요.</li>'}${Array.from({length:Math.max(0,endingCount()-ends.length)},()=>'<li class="locked">？？？</li>').join('')}</ul>`;
 d.innerHTML=`<div class="dialog-header"><div><small>GALLERY</small><h2>갤러리</h2></div><button class="quiet" data-close>닫기 ×</button></div>${tabs}<div class="gl-body">${body}</div><div class="mg-view" hidden><img alt=""></div>`;
 const close=()=>{d.close();d.className='';if(tab==='music')BGM.play('bgm_title');};
 d.querySelector('[data-close]').onclick=close;
 d.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{if(b.dataset.tab==='muk'){d.close();d.className='';return mukGallery();}if(tab==='music'&&b.dataset.tab!=='music')BGM.play('bgm_title');gallery(b.dataset.tab);});
 const view=d.querySelector('.mg-view');view.onclick=()=>view.hidden=true;
 d.querySelectorAll('.mg-card:not(.locked) .mg-main[data-set]').forEach(m=>m.onclick=()=>viewer(m.dataset.set.split(','),0));
 d.querySelectorAll('.gl-replay[data-rp]:not([data-rp=""])').forEach(m=>m.onclick=()=>{if(tab==='music')BGM.play('bgm_title');replay(sceneList()[+m.dataset.rp]);});
 d.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>{const n=b.dataset.play,on=b.classList.contains('playing');d.querySelectorAll('[data-play]').forEach(x=>{x.classList.remove('playing');x.textContent='▶';});if(on){BGM.play('');return;}b.classList.add('playing');b.textContent='■';BGM.play(n);});
 if(!d.open)d.showModal();
}
// ── 인물 프로필: 엔딩을 하나라도 본 뒤 열린다(data/profiles.js). 혜진은 히든 엔딩 뒤.
function profileOpen(){return (records.endings||[]).length>0;}
function profiles(sel){
 const hid=(records.endings||[]).includes('연표의 신부들');const P=(window.PROFILES||[]).filter(p=>!['hyejin','myeongwol','husband'].includes(p.id)||hid);
 const d=$('#vnLog');d.className='sheets gallery profiles';
 const face=(id,e='smile')=>{const q=P.find(x=>x.id===id);if(q?.img&&e==='smile')return asset(q.img+'.webp');const s=CAST[id]?.stand||{};const f=s[e]||s.smile||s.neutral;return f?asset(f+'.webp'):asset('emblem_gold.webp');};
 // 모습: data/stands.js(tools/stand_index.py)에 있는 그 인물의 스탠딩을 모두 보여 준다(2026.11 주인님 지정). 표정 / 옷 / 흐트러짐으로 묶는다.
 const PF_EXP={smile:'웃음',neutral:'평소',shy:'부끄러움',surprised:'놀람',angry:'화남',pout:'삐짐',teary:'눈물',worry:'걱정',serious:'진지',excited:'신남',explain:'설명',sad:'슬픔',lonely:'쓸쓸',smirk:'비웃음',writing:'기록',pregnant:'임신',despair:'절망',wet:'비에 젖음'};
 const PF_COST={home:'집옷',hanbok:'한복',school:'교복',idol:'아이돌',mom:'엄마',baekje:'백제',buyeo:'부여',goryeo:'고려',hwarang:'화랑',joseon:'조선',neolithic:'신석기'};
 const pfLabel=(id,f)=>{const rest=f.slice(`st_${id}`.length).replace(/^_/,'');if(!rest)return {g:'옷',t:'처음 모습',o:0};const tk=rest.split('_');let cost=[],ex=[],dmg='';
  for(const k of tk){let m;if((m=k.match(/^d(\d)$/)))dmg=`찢어짐 ${m[1]}`;else if((m=k.match(/^g(\d)$/)))dmg=`흐트러짐 ${m[1]}`;else if(PF_EXP[k])ex.push(PF_EXP[k]);else cost.push(id==='muk'&&window.MUK_SKINS?.[k]?.name||PF_COST[k]||k);}
  const t=[...cost,...ex,dmg].filter(Boolean).join(' · ');const ei=Object.keys(PF_EXP).indexOf(tk.find(k=>PF_EXP[k])||'');
  return {g:dmg?'흐트러짐':cost.length?'옷':'표정',t,o:ei<0?0:ei};};
 const looks=p=>{const seen=new Set(),o=[];const add=(f,t,g='옷',ord=0)=>{if(seen.has(f))return;seen.add(f);o.push({f,t,g,ord});};
  const ST=(window.STANDS||{})[p.id];
  if(p.img)add(p.img,'기본','표정',-1);
  if(ST){const base=CAST[p.id]?.stand?.smile;if(base)add(base,'웃음','표정',-1);ST.forEach(f=>{const l=pfLabel(p.id,f);add(f,l.t,l.g,l.o);});}
  (p.looks||[]).forEach(([f,t])=>{const m=f.match(/^st_([a-z]+)_/);const l=m?pfLabel(m[1],f):{t,g:'옷',o:0};add(f,l.t,l.g,l.o);});
  if(!o.length){const s=CAST[p.id]?.stand||{};if(s.smile)add(s.smile,'기본','표정');}
  const G=['표정','옷','흐트러짐'];return o.sort((a,b)=>G.indexOf(a.g)-G.indexOf(b.g)||(a.g!=='표정'?a.t.localeCompare(b.t,'ko'):0)||a.ord-b.ord);};
 const groups=[...new Set(P.map(p=>p.group))];
 const list=`<div class="pf-list">${groups.map(g=>`<h3 class="gl-h">${esc(g)}</h3><div class="pf-grid">${P.filter(p=>p.group===g).map(p=>`<button class="pf-card${p.id===sel?' on':''}" data-pf="${p.id}"><span class="pf-face${p.silhouette?' sil':''}"><img loading="lazy" src="${face(p.id)}" alt=""></span><b>${esc(p.name)}</b><small>${esc(p.sub)}</small></button>`).join('')}</div>`).join('')}</div>`;
 let body=list;
 const p=P.find(x=>x.id===sel);
 if(p){const i=P.indexOf(p),L=looks(p);
  const LG=[...new Set(L.map(x=>x.g))];
  body=`<div class="pf-detail"><div class="pf-art${p.silhouette?' sil':''}"><div class="pf-stage">${L.length>1?'<button class="pf-arrow" data-step="-1" aria-label="이전 모습">◀</button>':''}<img class="pf-stand" src="${L[0]?asset(L[0].f+'.webp'):face(p.id)}" alt="">${L.length>1?'<button class="pf-arrow" data-step="1" aria-label="다음 모습">▶</button>':''}</div>${L.length>1?`<div class="pf-count"><b>1</b> / ${L.length}</div><div class="pf-looks">${LG.map(g=>`<div class="pf-lg">${LG.length>1?`<small>${g}</small>`:''}${L.map((x,j)=>x.g===g?`<button data-look="${j}" class="${j?'':'on'}">${esc(x.t)}</button>`:'').join('')}</div>`).join('')}</div>`:''}</div>
  <div class="pf-info"><small>${esc(p.group)} · ${esc(p.sub)}</small><h2>${esc(p.name)}</h2>
  <table class="pf-table">${[["나이",p.age?`<b>${esc(p.age)}</b>`:"",p.ageNote],["온 시대",esc(p.era||"")],["신장",esc(p.height||"")],["체중",esc(p.weight||"")],["B · W · H",esc(p.bwh||"")]].filter(r=>r[1]||r[2]).map(([h,v,n])=>`<tr><th>${h}</th><td>${v}${n?`${v?"<br>":""}<small>${esc(n)}</small>`:""}</td></tr>`).join("")}</table>
  <p class="pf-desc">${esc(p.desc)}</p>
  ${p.life?`<h4>삶</h4><ol class="pf-life">${p.life.map(t=>`<li>${esc(t)}</li>`).join('')}</ol>`:''}${p.death?`<h4>마지막</h4><div class="pf-death">${p.death.split("\n").map(t=>`<p>${esc(t)}</p>`).join("")}</div>`:''}${p.likes?`<table class="pf-table"><tr><th>좋아하는 것</th><td>${esc(p.likes)}</td></tr><tr><th>싫어하는 것</th><td>${esc(p.dislikes)}</td></tr><tr><th>취미</th><td>${esc(p.hobby)}</td></tr><tr><th>특기</th><td>${esc(p.skill)}</td></tr></table>`:''}
  ${p.tmi?`<h4>TMI</h4><ul class="pf-tmi">${p.tmi.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:''}
  <div class="pf-nav"><button data-pf="${P[(i-1+P.length)%P.length].id}">◀ ${esc(P[(i-1+P.length)%P.length].name)}</button><button data-back>목록</button><button data-pf="${P[(i+1)%P.length].id}">${esc(P[(i+1)%P.length].name)} ▶</button></div></div></div>`;
 }
 d.innerHTML=`<div class="dialog-header"><div><small>CHARACTERS</small><h2>인물 프로필</h2></div><button class="quiet" data-close>닫기 ×</button></div><div class="gl-body">${body}</div>`;
 d.querySelector('[data-close]').onclick=()=>{d.close();d.className='';};
 d.querySelectorAll('[data-pf]').forEach(b=>b.onclick=()=>profiles(b.dataset.pf));
 d.querySelector('[data-back]')?.addEventListener('click',()=>profiles());
 if(p){const L=looks(p);let cur=0;const show=j=>{cur=(j+L.length)%L.length;d.querySelectorAll('[data-look]').forEach(x=>x.classList.toggle('on',+x.dataset.look===cur));const im=d.querySelector('.pf-stand');im.onerror=()=>{im.onerror=null;im.src=face(p.id);};im.src=asset(L[cur].f+'.webp');const c=d.querySelector('.pf-count b');if(c)c.textContent=cur+1;};
  d.querySelectorAll('[data-look]').forEach(b=>b.onclick=()=>show(+b.dataset.look));d.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>show(cur+ +b.dataset.step));}
 d.querySelector('.gl-body').scrollTop=0;
 if(!d.open)d.showModal();
}
// ── 장 선택: 한 번 들어간 장은 타이틀에서 처음부터 다시 볼 수 있다(records.chReached).
// 종장 이후(히든 엔딩 뒤 애프터·후일담): 히든 엔딩을 본 뒤 장 선택에 마디별로 열린다. 그 마디부터 이어서 끝까지 본다. 새 후일담을 쓰면 ch24에 @label aft_… 을 달고 한 줄 더한다.
const AFTER_PARTS=[
 {label:'aft_today',title:'오늘을 산다',sub:'편의점·욕실·옥상, 각자의 하루'},
 {label:'aft_breadwinners',title:'바깥양반들',sub:'월급날 밤과 도담의 진료소'},
 {label:'aft_spring',title:'이듬해 봄',sub:'첫 아기'},
 {label:'aft_firstcry',title:'첫 울음',sub:'밤 수유 길의 작업실'},
 {label:'aft_autumn',title:'그다음 해 가을',sub:'소파 위의 엄마와 딸'},
 {label:'aft_second',title:'둘째 회의',sub:'백 명 넘는 식구'},
 {label:'aft_tigerden',title:'범굴 어린이집',sub:'현관의 뽀뽀와 거실의 범'},
 {label:'aft_idol',title:'연회의 무대',sub:'생방송과 대기실'},
 {label:'aft_moa',title:'모아네 집',sub:'시장 어귀의 재회와 교복'},
 {label:'aft_husband',title:'그 밤',sub:'연표 바깥, 어느 아파트 부엌'},
];
function afterOpen(){return (records.endings||[]).includes('연표의 신부들');}
function reach(id){const a=records.chReached||(records.chReached=[]);if(!a.includes(id)){a.push(id);save();}}
function chapterSelect(){const d=$('#vnLog');d.className='sheets gallery';const got=new Set(records.chReached||[]);
 d.innerHTML=`<div class="dialog-header"><div><small>CHAPTER SELECT</small><h2>장 선택</h2></div><button class="quiet" data-close>닫기 ×</button></div><p class="mg-sum">한 번 들어간 장은 그 장 처음부터 다시 볼 수 있어요. 지금 이어하던 기록은 그대로 남아요.</p>
 <ul class="gl-ch">${chapters.map(c=>`<li class="${got.has(c.id)?'':'locked'}"><button data-ch="${c.id}" ${got.has(c.id)?'':'disabled'}><b>${esc(c.title)}</b><span>${got.has(c.id)?esc(c.subtitle||''):'？？？'}</span></button></li>`).join('')}</ul>${afterOpen()?`<h3 class="gl-sub">종장 이후 · 오늘을 산다</h3><ul class="gl-ch">${AFTER_PARTS.map(x=>`<li><button data-aft="${x.label}"><b>${esc(x.title)}</b><span>${esc(x.sub)}</span></button></li>`).join('')}</ul>`:''}`;
 d.querySelectorAll('[data-aft]').forEach(b=>b.onclick=()=>{d.close();d.className='';S=fresh('ep');S.pc=byId.ep.labels[b.dataset.aft]??0;log=[];shell();paint();step();});
 d.querySelector('[data-close]').onclick=()=>{d.close();d.className='';};
 d.querySelectorAll('[data-ch]').forEach(b=>b.onclick=()=>{d.close();d.className='';S=fresh(b.dataset.ch);log=[];shell();paint();step();});
 d.showModal();}
// 갤러리 기록이 생기기 전의 세이브: 세이브 위치보다 앞선 장은 들어간 장으로, 그 장들의 CG는 본 것으로 친다(한 번만).
function backfill(){if(records.galleryBackfill)return;let mx=-1;for(const v of Object.values(meta.saves||{})){const i=chapters.findIndex(c=>c.id===v?.state?.ch);if(i>mx)mx=i;}
 for(let i=0;i<=mx;i++){reach(chapters[i].id);if(i<mx)for(const o of chapters[i].ops)if(o.t==='bg'){const k=o.arg.split('|')[0].trim();if(/^cg_/.test(k))seeCg(k);}}
 records.galleryBackfill=1;save();}
// ── 세이브·로드 슬롯(24칸). 오토·퀵은 불러오기에서만 보인다.
const SLOT_N=24;
function slots(mode,fromTitle){
 if(mode==='save'&&(!S||!S.line)){toast('대사가 보일 때 저장할 수 있어요.');return;}
 const d=$('#vnLog');d.className='sheets gallery';
 const card=(k,label)=>{const v=meta.saves[k];const t=v?new Date(v.time):null;
  return `<button class="sl-card${v?'':' empty'}" data-slot="${k}" ${!v&&mode==='load'?'disabled':''}><div class="sl-thumb">${v?.state?.bg?`<img loading="lazy" src="${asset(v.state.bg)}" onerror="this.style.display='none'" alt="">`:''}<span>${esc(label)}</span></div><div class="sl-info">${v?`<b>${esc(v.chapter||'')}</b><small>${t.toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}${v.label?' · '+esc(v.label):''}</small><p>${esc((v.state?.line?.text||v.log?.[v.log.length-1]?.text||'').slice(0,46))}</p>`:'<small>비어 있음</small>'}</div></button>`;};
 const fixed=mode==='load'?`<h3 class="gl-h">자동 · 퀵</h3><div class="sl-grid">${card('auto','AUTO')}${card('quick','QUICK')}</div><h3 class="gl-h">슬롯</h3>`:'';
 d.innerHTML=`<div class="dialog-header"><div><small>${mode==='save'?'SAVE':'LOAD'}</small><h2>${mode==='save'?'세이브':'불러오기'}</h2></div><button class="quiet" data-close>닫기 ×</button></div>${fixed}<div class="sl-grid">${Array.from({length:SLOT_N},(_,i)=>card('s'+(i+1),String(i+1).padStart(2,'0'))).join('')}</div>`;
 const close=()=>{d.close();d.className='';};
 d.querySelector('[data-close]').onclick=close;
 d.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{const k=b.dataset.slot;
  if(mode==='save'){if(meta.saves[k]&&!confirm('이 칸에 덮어쓸까요?'))return;meta.saves[k]=snapshot();persist();SFX.play('save');toast('세이브 완료');slots('save');return;}
  close();loadFrom(k);});
 if(!d.open)d.showModal();}
// ── 회상: 갤러리에서 본 CG 장면을 그 CG가 뜨는 줄부터 다시 본다. 장면이 바뀌면(다이브·문제·배틀·CG 아닌 배경) 갤러리로 돌아간다.
function sceneList(){const out=[],seen=new Set();for(const c of [...chapters,...sides])c.ops.forEach((o,i)=>{if(o.t!=='bg')return;const k=o.arg.split('|')[0].trim();if(!/^cg_/.test(k)||/^cg_(ink_spread|comment_flame|ev_|mv_)/.test(k)||seen.has(k))return;seen.add(k);out.push({k,ch:c.id,t:c.title,pc:i});});return out;}
function replay(sc){closeDialogs();$('#vnLog').className='';S={...fresh(sc.ch),pc:sc.pc,replay:{from:sc.pc}};log=[];shell();paint();step();}
function endReplay(){busy=false;S=null;title();gallery('scene');}
// ── 차분: 같은 CG의 단계(…_b0~b3 등)를 한 묶음으로 보고, 확대 화면에서 ←/→·클릭으로 넘긴다(본 것만).
const varBase=k=>k.replace(/_(b|d|g)\d$/,'');
function viewer(list,i){const v=document.createElement('div');v.className='mg-view gl-viewer';
 const draw=()=>{v.innerHTML=`<img src="${asset(list[i]+'.webp')}" alt=""><span class="gl-count">${i+1} / ${list.length}</span>${list.length>1?'<button class="gl-nav prev">‹</button><button class="gl-nav next">›</button>':''}`;
  v.querySelector('.prev')?.addEventListener('click',e=>{e.stopPropagation();i=(i+list.length-1)%list.length;draw();});
  v.querySelector('.next')?.addEventListener('click',e=>{e.stopPropagation();i=(i+1)%list.length;draw();});};
 const key=e=>{if(e.key==='ArrowRight'){i=(i+1)%list.length;draw();}else if(e.key==='ArrowLeft'){i=(i+list.length-1)%list.length;draw();}else if(e.key==='Escape'){done();}};
 const done=()=>{v.remove();document.removeEventListener('keydown',key,true);};
 v.onclick=done;document.addEventListener('keydown',key,true);draw();($('#vnLog').open?$('#vnLog'):document.body).appendChild(v);}
function closeDialogs(){for(const d of document.querySelectorAll('dialog[open]'))d.close();}
function menu(k){
 if(k==='log')return openLog();
 if(k==='notebook')return notebook();
 if(k==='auto'){auto=!auto;skip=false;paint();if(auto&&!typing&&S.line)afterLine();return;}
 if(k==='skip'){skip=!skip;auto=false;paint();if(skip){if(typing)finishType();else if(S.line)afterLine();}return;}
 if(k==='save')return slots('save');
 if(k==='load')return slots('load');
 if(k==='qsave')return saveTo('quick');
 if(k==='qload')return loadFrom('quick');
 if(k==='config')return config();
 if(k==='hide')return setHidden(true);
 if(k==='title'){if(confirm('타이틀로 돌아갈까요? 오토 세이브 시점까지는 남아 있어요.'))title();}
}

// ── 타이틀.
// 시작 화면: 브라우저는 사용자가 한 번 누르기 전엔 소리를 막는다. 여기서 한 번 눌러야 타이틀 BGM이 바로 나온다.
function splash(){
 document.body.classList.add('vn-mode');
 $('#main').innerHTML=`<section class="vn-splash" tabindex="0"><img class="vn-title-bg" src="${asset('bg_timeline_dive.webp')}" alt=""><img class="vn-emblem-splash" src="${asset('emblem_gold.webp')}" alt="오르페이아의 문장"><div class="vn-splash-body"><span class="vn-seal">電脳侍女</span><h1><span class="vn-title-brush">연표</span>오르페이아</h1><p class="vn-splash-press">화면을 눌러 시작</p><small>소리가 함께 나와요 ♪</small></div></section>`;
 const el=$('.vn-splash');el.focus();
 let gone=false;const go=e=>{if(gone)return;if(e.type==='keydown'&&['Shift','Control','Alt','Meta','Tab'].includes(e.key))return;gone=true;el.removeEventListener('pointerdown',go);document.removeEventListener('keydown',go);el.classList.add('strum');SFX.play('vb_purify');setTimeout(title,650);};
 el.addEventListener('pointerdown',go);document.addEventListener('keydown',go);
}
// 외전은 히든 엔딩 「연표의 신부들」을 본 뒤에 열린다.
// 외전 목록: 타이틀 버튼(아이콘)과 열림 조건. 새 외전은 여기에 한 줄 더한다.
const SIDE_MENU=[
 {id:'sp_aunt',icon:'🍼',open:()=>(records.endings||[]).includes('연표의 신부들')},
 {id:'sp_exorcist',icon:'🔔',open:()=>(records.endings||[]).includes('연표의 신부들')},
 {id:'sp_saebyeok',icon:'🍳',open:()=>(records.endings||[]).includes('연표의 신부들')},
 {id:'sp_ellie',icon:'📅',open:()=>(records.endings||[]).includes('연표의 신부들')},
 {id:'sp_nights',icon:'🌙',open:()=>(records.endings||[]).includes('연표의 신부들')},
 {id:'sp_nights2',icon:'🍼',open:()=>(records.endings||[]).includes('연표의 신부들')},
];
function sideOpen(id){return SIDE_MENU.filter(x=>byId[x.id]&&x.open()&&(!id||x.id===id));}
function title(){
 BGM.play('bgm_title');stopAuto();clearTimeout(typing?.t);typing=null;busy=false;skip=false;auto=false;S=null;Quiz.close();closeDialogs();document.body.classList.add('vn-mode');
 const cont=latest(),st=Quiz.stats();backfill();
 const art=(records.endings||[]).length?'cg_title_clear':'cg_title';
 $('#main').innerHTML=`<section class="vn-title"><img class="vn-title-bg vn-title-art" src="${asset(art+'.webp')}" alt=""><img class="vn-emblem-title" src="${asset('emblem_gold.webp')}" alt=""><img class="vn-title-chr" src="${asset('st_orpheia_smile.webp')}" alt=""><div class="vn-title-body"><img class="vn-crest" src="${asset('emblem_gold.webp')}" alt="오르페이아의 문장"><small>韓國史 年表 · 한능검 심화</small><h1><span class="vn-title-brush">연표</span>오르페이아<span>얼굴 없는 작곡가와 역사덕후 보컬</span></h1><span class="vn-seal big">電脳<br>侍女</span>
 <p class="vn-title-sub">70~${Quiz.lastRound()}회 기출 ${st.total}문항 · 풀어 본 문항 ${st.seen} · 최근 정답 ${st.right}</p>
 <div class="vn-title-menu"><button class="primary" data-t="new">처음부터</button><button data-t="continue" ${cont?'':'disabled'}>이어하기</button><button data-t="load" ${cont?'':'disabled'}>💾 불러오기</button><button data-t="drill">📝 기출 풀기 · 회차·시대별</button><button data-t="notebook">📜 연표 기록부</button><button data-t="chsel">📖 장 선택</button>${sideOpen().map(x=>`<button data-t="side" data-s="${x.id}">${x.icon} 외전 · ${esc(byId[x.id].subtitle)}</button>`).join('')}<button data-t="gal">🎞 갤러리 · CG·음악·엔딩</button>${profileOpen()?'<button data-t="prof">👤 인물 프로필</button>':''}<button data-t="mini">🎮 미니게임</button><button data-t="gallery">🖋 묵 의상 도감</button><button data-t="config">설정</button></div>
 <p class="vn-title-note">이야기 속 문제는 모두 실제 한능검 심화 기출이에요.</p></div></section>`;
 const go={new:()=>{if(Object.keys(meta.saves).length&&!confirm('처음부터 시작할까요? 기존 세이브는 남아 있어요.'))return;reach(chapters[0].id);S=fresh(chapters[0].id);log=[];shell();paint();step();},continue:()=>loadFrom(cont),drill:()=>Quiz.lobby(title),notebook,config,gallery:mukGallery,gal:()=>gallery(),prof:()=>profiles(),mini:()=>window.MiniGame?.open(),chsel:chapterSelect,load:()=>slots('load',true),side:id=>{S=fresh(id||'sp_aunt');log=[];shell();paint();step();}};
 document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>go[b.dataset.t](b.dataset.s));
 // 타이틀 일러스트: 있으면 그 그림을 크게 깔고 스탠딩은 숨긴다. 엔딩을 본 뒤에는 새벽 작업실 그림, 없으면 기본 그림 → 연표 터널 배경 + 스탠딩.
 const bg=$('.vn-title-art'),sec=$('.vn-title');
 bg.onload=()=>sec.classList.add('has-art');
 bg.onerror=()=>{if(bg.src.includes('cg_title_clear')){bg.src=asset('cg_title.webp');return;}bg.onerror=null;bg.onload=null;sec.classList.remove('has-art');bg.src=asset('bg_timeline_dive.webp');};
}

// ── 키보드(이야기 화면에서만).
document.addEventListener('keydown',e=>{
 if(!$('#vn')||document.querySelector('dialog[open]')||Quiz.active())return;
 const box=$('#vnChoices');
 if(box&&!box.hidden&&/^[1-9]$/.test(e.key)){e.preventDefault();VN._pick?.(+e.key-1);return;}
 if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!e.repeat)advance();}
 else if(e.key==='Control'&&!e.repeat){skip=true;paint();if(typing)finishType();else if(S?.line)afterLine();}
 else if(e.key==='a'||e.key==='A')menu('auto');
 else if(e.key==='h'||e.key==='H')setHidden(!hidden);
 else if(e.key==='l'||e.key==='L')openLog();
});
document.addEventListener('keyup',e=>{if(e.key==='Control'&&skip){skip=false;if($('#vn'))paint();}});

return {_s:()=>S,_b:()=>({busy,typing:!!typing,hidden,auto,skip}),openSheets,flag:k=>S?.flags?.[k],chapter,title,splash,_pick:null,chapters,_dev:(id,pc)=>{S=fresh(id);if(pc!=null)S.pc=pc;log=[];shell();paint();step();}};
})();
