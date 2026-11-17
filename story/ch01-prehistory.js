VN.chapter('ch01','제1장','큰 돌을 세운 사람들',`
@chapter 제1장|큰 돌을 세운 사람들 — 선사 시대
@dive 아주 먼 옛날|구석기 시대
@bg bg_era_paleolithic
@day 구석기 시대 · 강가의 동굴 앞
바람에 마른 풀이 눕는다. 동굴 앞에 나뭇가지와 가죽으로 대충 엮은 움막이 하나. 모닥불 곁에서 누군가 돌을 돌에 내리치고 있다.
@show orpheia smile left
[오르페이아|smile] 주인님, 도착했어요! 여기가 구석기 시대예요.
[나] 저 사람, 돌을 깨서 뭘 만드는 거야?
[오르페이아|explain] 돌을 깨뜨리고 떼어 내서 날을 세우는 거예요. 그렇게 만든 도구가 뗀석기. 손에 쥐고 쓰는 저 묵직한 게 주먹도끼예요.
[오르페이아] 연천 전곡리, 공주 석장리. 주먹도끼가 나온 곳 이름은 기출에 자주 나와요.
@show sayeon neolithic right
[사연] 잘 오셨습니다, 읽는 분.
[오르페이아|surprised] 앗, 누구세요?!
[사연] 연표의 기록을 맡은 사연이라 합니다. 이 시대 사람의 차림을 빌렸지요. 문제지 여백에 글을 남긴 것도 저입니다.
[사연] 보십시오. 이 사람들은 오래 머물지 않습니다. 짐승이 떠나면 따라 떠나고, 열매가 지면 다른 골짜기로 갑니다.
[오르페이아|explain] 그래서 집도 저렇게 동굴이나 강가에 막집을 대충 짓는 거예요. 사냥하고 채집하면서 이동하는 생활!
@choice
> 이동 생활을 하니까 집을 오래 쓰지 않는다. -> c1ok {study+1}
> 농사를 지어서 한곳에 정착해 산다. -> c1ng
@label c1ng
[오르페이아|pout] 땡! 농사와 정착은 다음 시대, 신석기부터예요. 여기는 아직 사냥과 채집, 그리고 이동이에요.
@jump c1after
@label c1ok
[오르페이아|excited] 정답이에요♪ 뗀석기, 주먹도끼, 막집, 이동 생활. 구석기 세트 완성!
@label c1after
[사연] 그럼, 이 시대의 기록 하나를 바로잡아 보시지요. 번지기 전에.
@hide all
@quiz 79-1
@show sayeon neolithic right
@show orpheia smile left
@if quizFirst >= 1 -> q1good
[사연] 막집과 이동 생활. 다음에 보시면 알아보실 겁니다.
@jump q1after
@label q1good
[사연] 단번에 읽으셨군요. 기록이 또렷해졌습니다.
@add affection 1
@label q1after
@hide all

@dive 수천 년 뒤|신석기 시대
@bg bg_era_neolithic
@day 신석기 시대 · 강가 마을
강을 따라 둥근 초가지붕들이 늘어서 있다. 집 앞에 빗질한 듯한 무늬의 토기들이 놓였고, 강가에는 조개껍데기가 산처럼 쌓여 있다.
@show orpheia explain left
@show sayeon neolithic right
[사연] 사람들이 머물기 시작했습니다. 씨를 뿌리고, 짐승을 길들였지요.
[오르페이아|explain] 농경과 목축의 시작! 식량을 직접 만들어 내니까 한곳에 정착해서 마을을 이뤄요.
[나] 저 토기는 무늬가 빗질한 것 같네.
[오르페이아|smile] 그게 빗살무늬 토기예요. 거둔 곡식을 저기에 담아 두었어요. 서울 암사동 유적에서 많이 나왔어요.
[사연] 저 아낙이 돌리는 것을 보십시오. 실을 뽑는 도구입니다. 뼈로 만든 바늘로 옷을 깁고요.
@choice
> 가락바퀴 -> c2ok {study+1}
> 반달 돌칼 -> c2ng
> 주먹도끼 -> c2ng
@label c2ng
[오르페이아|pout] 아쉬워요! 반달 돌칼은 청동기의 수확 도구, 주먹도끼는 구석기예요. 실을 뽑는 건 가락바퀴, 바늘은 뼈바늘이에요.
@jump c2after
@label c2ok
[오르페이아|excited] 맞아요! 가락바퀴와 뼈바늘로 옷을 지었어요. 강가의 조개더미도 이 시대의 단서예요.
@label c2after
@hide all
@quiz 78-1
@show orpheia smile left
@if quizFirst >= 1 -> q2good
[오르페이아|worry] 괜찮아요. 농경·목축의 시작, 빗살무늬 토기, 가락바퀴. 세 개만 기억해요.
@jump q2after
@label q2good
[오르페이아|excited] 신석기도 완벽해요♪
@label q2after
@hide all

@dive 다시 수천 년 뒤|청동기 시대
@bg cg_ch01_dolmen
@day 청동기 시대 · 고인돌이 선 언덕
언덕 위에 거대한 덮개돌이 굄돌 위에 얹혀 있다. 그 아래로 수십 명이 통나무를 깔고 또 하나의 큰 돌을 끌어올리고 있다.
@show orpheia surprised left
@show sayeon neolithic right
[오르페이아|surprised] 와아…… 이렇게 큰 돌을 사람 손으로 옮기는 거예요?
[사연] 마을 사람이 모두 나섰습니다. 이 돌 아래 묻힐 이는, 그 사람들을 부릴 수 있는 사람이지요.
[오르페이아|serious] 주인님, 이게 핵심이에요. 농사가 잘되면 곡식이 남고, 남은 곡식을 가진 사람과 못 가진 사람이 생겨요. 사유 재산이 생기고, 계급이 생긴 거예요.
[나] 그럼 이 고인돌은……
@choice
> 많은 사람을 부릴 수 있었던 지배자의 무덤 -> c3ok {study+1}
> 마을 사람 모두가 함께 쓰는 공동 무덤 -> c3ng
@label c3ng
[오르페이아|worry] 함께 쓰는 무덤은 옥저의 가족 공동 무덤 같은 거예요. 나중에 만나요. 고인돌은 지배층의 무덤이에요.
@jump c3after
@label c3ok
[오르페이아|excited] 정답! 고인돌은 지배층의 무덤이에요. 80회 1번의 화순 고인돌 유적은 유네스코 세계 유산이에요.
@label c3after
[사연] 저 밭의 이들도 보십시오. 반달 모양의 돌칼로 벼 이삭을 자르고 있습니다. 무늬 없는 토기에 곡식을 담고요.
[오르페이아|explain] 반달 돌칼, 민무늬 토기, 비파형 동검. 그리고 제사장이 흔드는 청동 방울은 의례 도구예요. 부여 송국리, 여주 흔암리의 탄화미도 단서고요.
@hide all
@quiz 80-1
@show orpheia smile left
@if quizFirst >= 1 -> q3good
[오르페이아|smile] 주인님이 80회에서 틀렸던 문제죠? 이제는 고인돌을 보면 청동기, 절대 안 잊으실 거예요.
@jump q3after
@label q3good
[오르페이아|teary] 주인님이 80회에서 틀렸던 그 문제를…… 맞히셨어요. 저 눈물 날 것 같아요.
@add affection 1
@label q3after
@hide all

@bgm off
@bg cg_ink_spread
갑자기 하늘에 먹물이 번진다. 고인돌 위로, 밭 위로, 검은 얼룩이 퍼져 나간다.
@show muk smirk center
[묵|smirk] 또 왔네, 읽는 사람.
[오르페이아|serious] 당신이군요. 1번 문제에 먹물을 떨어뜨린 사람!
[묵] 묵이라고 해. 반달 돌칼이든 빗살무늬 토기든, 다 옛날 돌멩이잖아. 순서 좀 섞여도 아무도 안 아파.
[사연] 섞이면 아픈 사람이 있습니다. 그 기록으로 시험을 보는 사람들이요.
[묵|angry] ……그럼 맞혀 봐. 내가 섞은 걸 전부.
@hide all
@quiz era=선사 n=3
@show muk surprised center
@if quizFirst >= 2 -> sealok
[묵|smirk] 하나둘은 남았네. 뭐, 다음에 또 보자.
@jump sealafter
@label sealok
[묵|surprised] ……다 읽었어?
[묵|lonely] 흥. 다음 시대는 그렇게 쉽지 않을걸.
@label sealafter
@hide all
@bgm auto
@bg cg_ch01_dolmen
@show sayeon neolithic right
@show orpheia smile left
[사연] 이 시대의 기록이 다시 또렷해졌습니다. 여기까지 첫 시도에 바로잡으신 기록이 {quizAll}개입니다.
[사연] 다음 좌표는 나라가 처음 생겨난 때입니다. 축제가 많은 시대지요. 제천 행사의 이름을 잘 들어 두십시오.
[오르페이아|excited] 축제래요, 주인님! 다음은 고조선과 여러 나라예요.
@hide all
@end
`);
