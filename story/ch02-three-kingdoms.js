VN.chapter('ch02','제2장','무령왕의 석수',`
@chapter 제2장|무령왕의 석수 — 삼국과 가야
@bg cg_ch02_baekje
강을 내려다보는 산성. 세 나라와 가야가 이 땅을 두고 다투던 시절이 있었다.
@bg bg_lecture_room
@day 11월 20일 (목) 19:00 · 스터디 강의실
@show teacher neutral center
[서도희] 삼국은 보통 3번부터 7번 사이예요. 한 회에 서너 문항.
[서도희|stern] 삼국 문제의 절반은 「이 왕은 누구인가」예요. 그리고 그 왕을 알면, 「그 왕 이전인가 이후인가」를 물어요.
[서도희] 79회 3번이 그랬어요. 삼근왕. 이름도 낯선 왕을 주고, 그 뒤의 백제를 물었죠.
@hide all
@show harin surprised left
[유하린|surprised] 삼근왕? 그런 왕이 있었어?
@show jian serious right
[류지안|serious] 13세에 즉위해서 2년 만에 세상을 떠난 왕이요. 개로왕의 손자.
[유하린|pout] 지안이 너는 그런 걸 어떻게 외워……
[류지안] 외운 게 아니라 틀려서 기억하는 거예요.
@hide all
@quiz 79-3
@if quizFirst >= 1 -> q1good
@phone on
@show orpheia explain center
[오르페이아|explain] 주인님, 삼근왕은 웅진 시기 5세기 후반이에요. 그 뒤에 온 왕이 무령왕, 22담로에 왕족을 보냈어요.
[오르페이아] 근초고왕·침류왕·아신왕은 모두 그보다 앞이에요. 순서로 기억하면 돼요.
@jump q1after
@label q1good
@phone on
@show orpheia excited center
[오르페이아|excited] 정답이에요♪ 삼근왕 다음은 무령왕, 22담로!
@label q1after
[오르페이아|smile] 무령왕 얘기가 나온 김에, 80회 3번도 봐요. 인공 지능 대화창이 나와요. ……저 같은 거요.
[나] 너보다 말투가 딱딱하던데.
[오르페이아|pout] 저는 저렇게 「원하시면 ~를 알려드릴 수 있어요」 같은 말은 안 해요!
@hide all
@phone off
@quiz 80-3
@if quizFirst >= 1 -> q2good
@show teacher stern center
[서도희|stern] 사진 문제는 탑 이름을 시대와 같이 외워야 해요. 불국사 다보탑은 통일 신라, 분황사 모전 석탑은 신라, 미륵사지 석탑은 백제.
@jump q2after
@label q2good
@show teacher smile center
[서도희|smile] 무령왕릉 석수에서 백제, 그리고 미륵사지 석탑. 사진까지 잘 골랐어요.
@label q2after
@hide all
@show teacher neutral center
[서도희] 신라로 넘어가요. 신라는 왕의 업적 묶음이 핵심이에요. 지증왕, 법흥왕, 진흥왕.
[서도희|stern] 80회 4번은 「신라 제22대 왕」, 국호 신라 확정, 우경 장려. 누군지 알겠죠?
@quiz 80-4
@if quizFirst >= 1 -> q3good
[서도희] 지증왕은 국호를 신라로 정하고 우경을 장려했고, 이사부를 보내 우산국을 복속했어요. 원광의 걸사표는 진평왕 때, 집사부 설치는 진덕여왕 때예요.
@jump q3after
@label q3good
[서도희|smile] 좋아요. 지증왕과 이사부, 우산국.
@label q3after
@hide all
@show harin excited left
@show jian smile right
[유하린|excited] 마지막은 가야지? 가야는 자신 있어! 철!
[류지안|smile] 그런데 김해의 금관가야인지, 고령의 대가야인지는 구별해야 해요.
[유하린|surprised] ……그것도 구별해야 돼?
@hide all
@quiz 79-4
@phone on
@show orpheia explain center
@if quizFirst >= 1 -> q4good
[오르페이아|explain] 김해 대성동 고분군, 김수로왕은 금관가야예요. 낙랑과 왜에 철을 수출한 것도 금관가야. 고령 지산동은 대가야예요.
@jump q4after
@label q4good
[오르페이아|excited] 정답이에요♪ 김해는 금관가야, 낙랑과 왜에 철 수출!
@add affection 1
@label q4after
@hide all
@phone off
@show teacher coffee center
[서도희|coffee] 오늘 첫 시도 정답은 이야기 전체로 {quizAll}개째예요. 숫자는 신경 쓰지 말고, 틀린 문항만 기억해요.
[서도희] 다음 시간은 남북국. 발해는 열한 회 중 열 번 나왔어요.
@hide all
@bg bg_street_evening
@day 21:00 · 돌아오는 길
@phone on
@show orpheia smile center
[오르페이아|smile] 주인님, 오늘 무령왕 문제 두 개나 나왔어요. 석수, 22담로, 지석, 벽돌무덤.
[나] 무령왕 세트구나.
[오르페이아|excited] 네! 주인님이 「세트」라고 말해 주셔서 기뻐요. 그게 제가 드리고 싶었던 말이에요.
@choice
> 다음엔 발해도 세트로 외워 보자. -> end1 {affection+1}
> 오늘은 좀 쉬고 싶다. -> end2
@label end2
[오르페이아|shy] 네. 쉬는 것도 공부예요. 대신 자기 전에 「김해는 금관가야」 한 번만요.
@jump fin
@label end1
[오르페이아|excited] 네! 고왕, 무왕, 문왕, 선왕. 다음엔 그 네 분이에요.
@label fin
@phone off
@hide all
@end
`);
