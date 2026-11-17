VN.chapter('ch01','제1장','1번과 2번 사이',`
@chapter 제1장|1번과 2번 사이 — 선사와 여러 나라
@bg bg_training_room
@day 11월 18일 (화) 19:00 · 스터디 강의실
@show harin smile left
[유하린|smile] 왔다! 80회 몇 점 나왔어? 난 비밀!
[나] 그럼 나도 비밀.
@show jian neutral right
[류지안] 저는 적어 왔어요. 80회 틀린 문항 열한 개. 번호순으로.
[유하린|surprised] 열한 개를 번호순으로 정리해 왔다고?!
[류지안|serious] 정리하니까 보이는 게 있어서요. 틀린 게 앞쪽에 몰려 있지 않았어요. 고르게 퍼져 있었어요.
@hide all
@show teacher neutral center
[서도희] 자리에 앉아요. 오늘부터 시대 순서대로 가요. 시험지 순서랑 똑같이.
[서도희|stern] 한능검 심화 1번은 거의 언제나 선사 시대예요. 2번, 3번 언저리가 여러 나라의 성장이고요.
[서도희] 그러니까 1번에서 할 일은 하나예요. 유물 사진을 보고 구석기·신석기·청동기·철기 중 하나로 정하는 것.
@phone on
@show orpheia explain right
[오르페이아|explain] 주인님, 열한 회 동안 1번은 열한 번 모두 선사였어요. 그중 청동기가 여섯 번으로 가장 많았고요.
[서도희|coffee] 휴대폰이 대답하네요. ……틀린 말은 아니에요.
[오르페이아|shy] 죄송해요. 끼어들어서…….
[서도희] 괜찮아요. 맞는 말은 누가 해도 맞는 말이니까.
@hide orpheia
@phone off
[서도희|stern] 2번부터는 단서를 묶어서 기억해요. 나라 하나에 단서 세 개.
[서도희] 영고, 흰옷, 형사취수제. 책화, 족외혼, 호랑이 숭배. 이 둘을 한 문제에 같이 내기도 해요. 79회 2번처럼요.
@quiz 79-2
@if quizFirst >= 1 -> q1good
[서도희] 단궁·과하마·반어피는 동예의 특산물. 오늘 집에 가서 소리 내어 세 번 읽어요.
@jump q1after
@label q1good
[서도희|smile] 좋아요. 동예의 특산물까지 바로 잡았네요.
@label q1after
@hide all
@show harin pout left
@show jian neutral right
[유하린|pout] 근데 80회 2번은 사료만 잔뜩 나왔잖아. 대로, 패자, 고추가…… 그게 뭔데!
[류지안] 저도 그거 틀렸어요. 연노부, 절노부라는 말에서 멈췄어요.
@phone on
@show orpheia smile center
[오르페이아|smile] 그럴 땐 아는 단어 하나만 붙잡으면 돼요. 대로, 패자는 왕 아래 관리 이름이었죠?
[유하린|surprised] 아 맞다, 상가·대로·패자!
[오르페이아|excited] 네! 그럼 어느 나라일까요? 하린 님 대신 주인님이 풀어 봐요.
@hide all
@quiz 80-2
@if quizFirst >= 1 -> q2good
@show orpheia worry center
[오르페이아|worry] 괜찮아요. 상가·대로·패자, 고추가는 고구려. 혼인하면 여자 집 뒤에 서옥을 짓는 것도 고구려예요.
@jump q2after
@label q2good
@show orpheia excited center
[오르페이아|excited] 정답! 상가·대로·패자를 보고 고구려, 그리고 서옥제. 완벽해요♪
@add affection 1
@label q2after
@hide all
@show teacher neutral center
[서도희] 마지막으로 선사와 여러 나라에서 섞어서 두 문제. 이번엔 제가 고르지 않아요. 아직 안 푼 문제부터 나와요.
@quiz era=선사,초기국가 n=2
[서도희|coffee] 첫 시도에 {quizFirst}개. 오늘은 여기까지.
[서도희|stern] 숙제예요. 영고·동맹·무천, 그리고 각 나라의 특산물과 풍습을 한 줄씩 말할 수 있게.
@hide all
@bg bg_cherry_street
@day 21:10 · 돌아오는 길
@phone on
@show orpheia smile center
[오르페이아|smile] 주인님, 오늘 수고 많으셨어요.
[나] 하린이랑 지안이도 다 틀리는 거였구나.
[오르페이아|explain] 네. 80회 2번처럼 낯선 사료가 나와도, 아는 단어 하나를 붙잡으면 돼요. 그게 오늘 배운 거예요.
[오르페이아] 복습 퀴즈! 영고는 어느 나라?
@choice
> 부여 -> rv_ok {affection+1}
> 고구려 -> rv_ng
> 동예 -> rv_ng
@label rv_ng
[오르페이아|pout] 땡! 고구려는 동맹, 동예는 무천이에요. 영고는 부여예요. 12월에 열었어요.
@jump rv_after
@label rv_ok
[오르페이아|excited] 정답이에요♪ 12월의 영고, 부여. 내일도 기억해 주세요.
@label rv_after
[오르페이아|shy] 다음 시간은 삼국이에요. 3번부터 7번 근처요. 주인님이 좋아하실 무령왕도 나와요.
@phone off
@hide all
@end
`);
