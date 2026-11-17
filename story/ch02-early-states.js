VN.chapter('ch02','제2장','다섯 나라의 축제',`
@chapter 제2장|다섯 나라의 축제 — 고조선과 여러 나라
@dive 기원전 2세기|고조선
@bg bg_era_gojoseon
@day 고조선 · 왕검성
흙을 다져 쌓은 성벽 위로 깃발이 날린다. 큰 강을 따라 배들이 드나들고, 성문 앞은 다른 나라 말을 쓰는 상인들로 붐빈다.
@show orpheia explain left
@show sayeon buyeo right
[사연] 고조선의 도읍, 왕검성입니다. 단군왕검이 세웠다고 전하는, 우리 역사의 첫 나라이지요.
[오르페이아|explain] 왕 아래에 상, 대부, 장군 같은 관직이 있었어요. 그리고 범금 8조라는 법으로 사회 질서를 지켰어요.
[나] 상인이 많네.
[사연] 주변 나라들 사이에서 물건을 이어 주는 중계 무역으로 부를 쌓았습니다. 그것이 한나라의 눈에 거슬렸지요.
[오르페이아|serious] 진나라와 한나라가 바뀌던 혼란기에 사람들이 고조선으로 넘어왔어요. 그중 위만이 준왕을 몰아내고 왕이 되었고요.
[사연] 우거왕 때, 한 무제의 군대가 왕검성을 에워쌉니다. 기원전 108년의 일입니다.
@choice
> 범금 8조 -> c1ok {study+1}
> 1책 12법 -> c1ng
> 책화 -> c1ng
@label c1ng
[오르페이아|pout] 땡! 1책 12법은 부여·고구려, 책화는 동예예요. 고조선의 법은 범금 8조!
@jump c1after
@label c1ok
[오르페이아|excited] 맞아요! 고조선은 범금 8조, 상·대부·장군, 왕검성, 우거왕과 한 무제.
@label c1after
@hide all
@quiz 77-2
@show sayeon buyeo right
@if quizFirst >= 1 -> q1good
[사연] 우거왕과 한 무제가 보이면 고조선입니다. 다시 오시면 또렷하실 겁니다.
@jump q1after
@label q1good
[사연] 첫 나라의 기록이 바로 섰습니다.
@label q1after
@hide all

@dive 북쪽의 겨울|부여
@bg bg_era_buyeo_festival
@day 부여 · 12월 눈 내린 밤
눈 덮인 마을 한가운데 큰불이 타오른다. 집집마다 흰옷이 널려 있고, 흰옷 입은 사람들이 불 주위를 돌며 노래한다.
@show orpheia excited left
@show sayeon buyeo right
[오르페이아|excited] 와아, 축제예요!
[사연] 부여의 영고입니다. 12월에 하늘에 제사를 올리고 며칠이고 먹고 마시며 노래하지요. 흰옷을 즐겨 입는 사람들입니다.
[오르페이아|explain] 부여는 고구려의 북쪽에 있었어요. 왕 아래 마가, 우가, 저가, 구가 같은 여러 가(加)가 사출도를 나누어 다스렸어요.
[사연] 전쟁이 나면 소를 잡아 그 발굽을 보고 길흉을 점칩니다. 도둑질하면 열두 배로 갚게 하고요.
[오르페이아] 우제점법, 그리고 1책 12법! 형이 죽으면 형수를 아내로 맞는 형사취수제도 있었어요.
@choice
> 12월의 영고 -> c2ok {study+1}
> 10월의 동맹 -> c2ng
> 10월의 무천 -> c2ng
@label c2ng
[오르페이아|worry] 아까워요! 10월 동맹은 고구려, 10월 무천은 동예예요. 부여는 12월의 영고.
@jump c2after
@label c2ok
[오르페이아|excited] 정답♪ 눈 속의 영고, 부여!
@label c2after
@hide all
@quiz 71-2
@show orpheia smile left
@if quizFirst >= 1 -> q2good
[오르페이아|smile] 사출도, 우제점법, 영고. 이 셋이면 부여예요.
@jump q2after
@label q2good
[오르페이아|excited] 부여도 완벽! 주인님, 눈 맞으면서 맞히니까 더 멋져요.
@label q2after
@hide all

@dive 압록강 언저리|고구려
@bg bg_era_goguryeo
@day 고구려 · 10월 산골 마을
단풍 든 골짜기. 집집마다 기둥을 세워 띄운 작은 창고가 붙어 있다. 큰 집 뒤편에서는 젊은 사내가 작은 집을 짓고 있다.
@show orpheia explain left
@show sayeon buyeo right
[사연] 고구려입니다. 집마다 붙은 저 작은 창고를 부경이라 하지요.
[오르페이아|explain] 그리고 저 사내가 짓는 집은 서옥이에요! 혼인하면 신랑이 신부 집에 지은 작은 집에서 지내는 서옥제!
[사연] 다섯 부족이 모여 이룬 나라로, 왕은 계루부에서 나옵니다. 왕 아래에 상가, 대로, 패자가 있고, 나라의 큰일은 제가 회의에서 정하지요.
[오르페이아] 10월에는 동맹이라는 제천 행사를 열어요. 왕족으로서 대가인 사람은 고추가라고 불렸고요.
@choice
> 서옥제, 부경, 10월 동맹 -> c3ok {study+1}
> 민며느리제, 가족 공동 무덤 -> c3ng
@label c3ng
[오르페이아|pout] 그건 바닷가의 옥저예요. 곧 만나요! 고구려는 서옥제, 부경, 동맹.
@jump c3after
@label c3ok
[오르페이아|excited] 완벽해요! 고구려 세트예요.
@label c3after
@hide all
@quiz 80-2
@show orpheia smile left
@if quizFirst >= 1 -> q3good
[오르페이아|smile] 80회 2번은 사료가 길었죠. 대로·패자 같은 아는 단어 하나만 붙잡으면 돼요.
@jump q3after
@label q3good
[오르페이아|excited] 낯선 사료도 단어 하나로 뚫으셨어요♪
@add affection 1
@label q3after
@hide all

@dive 동해 바닷가|옥저와 동예
@bg bg_era_east_coast
@day 옥저와 동예 · 동해안
파도 소리. 해안에는 물고기와 소금이 널려 있고, 산 너머 마을 경계에는 표식이 꽂혀 있다.
@show sayeon buyeo right
@show orpheia explain left
[사연] 바닷가의 작은 나라들입니다. 큰 왕 없이 삼로 같은 군장이 마을을 다스리지요.
[오르페이아|explain] 먼저 옥저! 민며느리제라는 혼인 풍습이 있었어요. 그리고 가족이 함께 묻히는 가족 공동 무덤(골장제).
[사연] 산 너머는 동예입니다. 다른 마을의 경계를 넘어 들어가면 노비와 소, 말로 갚아야 하지요.
[오르페이아] 그게 책화예요! 같은 씨족끼리는 혼인하지 않는 족외혼, 호랑이를 신으로 모신 것, 10월의 무천도 동예예요.
[사연] 특산물도 기억하십시오. 단궁이라는 활, 과하마라는 작은 말, 반어피라는 바다짐승 가죽.
@choice
> 단궁·과하마·반어피는 동예 -> c4ok {study+1}
> 단궁·과하마·반어피는 옥저 -> c4ng
@label c4ng
[오르페이아|worry] 옥저는 민며느리제와 가족 공동 무덤. 특산물 세 개는 동예예요!
@jump c4after
@label c4ok
[오르페이아|excited] 정답이에요♪ 책화, 무천, 단궁·과하마·반어피. 동예!
@label c4after
@hide all
@quiz 77-3
@hide all

@dive 남쪽의 들판|삼한
@bg bg_era_sodo
@day 삼한 · 오월의 들판
막 모내기를 마친 논 너머, 큰 나무에 방울이 걸려 있다. 그 숲 안으로는 아무도 함부로 들어가지 않는다.
@show sayeon buyeo right
@show orpheia explain left
[사연] 남쪽의 삼한입니다. 신지와 읍차가 다스리지만, 저 숲만은 다르지요.
[오르페이아|explain] 저기가 소도예요! 제사를 맡은 천군이 다스리는 신성한 곳이라, 정치를 맡은 군장도 손대지 못했어요.
[사연] 씨를 뿌린 5월, 거두어들인 10월에 하늘에 제사를 지냅니다. 그리고 이곳에서는 철이 많이 납니다.
@choice
> 천군과 소도는 삼한 -> c5ok {study+1}
> 천군과 소도는 고구려 -> c5ng
@label c5ng
[오르페이아|pout] 고구려는 제가 회의와 동맹이에요. 천군·소도는 삼한!
@jump c5after
@label c5ok
[오르페이아|excited] 맞아요! 신지·읍차, 천군·소도, 5월제와 10월제.
@label c5after
@hide all
@quiz 73-4
@hide all

@bgm off
@bg cg_ink_spread
축제의 불빛 위로 먹물이 번진다. 영고, 동맹, 무천…… 세 이름이 서로 엉켜 뒤바뀐다.
@show muk smirk center
[묵|smirk] 12월이든 10월이든, 하늘에 제사 지내는 건 다 똑같잖아.
[오르페이아|serious] 똑같지 않아요! 눈 속의 영고, 단풍 속의 동맹, 바닷가의 무천. 주인님은 다 보고 왔어요.
[묵|angry] 그럼 이것도 맞혀 봐. 두 나라를 한꺼번에 묶어 놨으니까.
@hide all
@quiz 79-2 78-3 70-2
@show muk lonely center
@if quizFirst >= 2 -> sealok
[묵|smirk] 거봐, 헷갈리잖아. ……다음에 또 섞어 줄게.
@jump sealafter
@label sealok
[묵|lonely] ……어떻게 그렇게 다 기억해.
[묵] 나는 아무도 기억해 주지 않았는데.
@label sealafter
@hide all
@bgm auto
@bg bg_era_buyeo_festival
@show sayeon buyeo right
@show orpheia smile left
[사연] 다섯 나라의 축제가 제자리를 찾았습니다.
[사연|buyeo] ……저 아이, 묵. 화가 난 것이 아니라 외로운 것일지도 모릅니다.
[오르페이아|worry] 외로운 기록……
[사연] 다음 좌표는 세 나라가 강을 두고 다투던 때입니다. 가야의 철도 빛나지요.
[오르페이아|excited] 삼국 시대예요, 주인님! 오늘은 여기까지 하고, 따뜻한 데서 쉬어요.
@hide all
@end
`);
