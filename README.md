# 오르페이아 · 電脳侍女의 한국사 연표

한국사능력검정시험 **심화** 기출(70~80회, 550문항)로 공부하는 비주얼 노벨이다.
휴대폰 속 가정교사 오르페이아와 스터디 동료들이 시험지 순서(1번 선사 → 50번 현대)대로 한 시대씩 나아가며,
이야기 사이사이에 **실제 기출 문항**을 푼다.

- 틀리면 「되감기」: 고른 보기의 실제 주인(시대·인물·제도)을 보여 주고 다시 고르게 한다. 첫 시도만 점수.
- 맞히면 단서·정답 근거·기억할 점·보기 다섯 개 해설.
- 타이틀의 **기출 풀기**: 시대별 10문항(안 푼 문항 → 최근에 틀린 문항 순), 회차 전체 50문항, 최근에 틀린 문항만.

## 실행

빌드가 없는 정적 페이지다. `python3 -m http.server` 로 띄우고 `index.html` 을 연다(GitHub Pages 그대로 가능).

## 데이터

문항·해설·자료 그림 목록·핵심노트는 학습 사이트 [korean-history-study](https://github.com/skybridge805679-netizen/korean-history-study)에서 가져온다.

```sh
python3 tools/sync-data.py ../korean-history-study   # data/ 갱신
```

자료 그림 파일은 복사하지 않고 학습 사이트의 GitHub Pages(`core.js`의 `IMG_BASE`)에서 불러온다.

## 구조

```
index.html          스크립트 목록
core.js             공용 도우미, 문항 기록(localStorage)
vn.js               이야기 엔진(오르페이아 철도 ADV의 엔진을 옮김) — 대본 문법은 같다
quiz.js             기출 문제 화면(@quiz)과 「기출 풀기」 로비
bgm.js · sfx.js     음악·효과음(효과음은 Web Audio 합성)
story/chNN-*.js     장 대본
data/               학습 사이트에서 동기화한 기출 데이터
assets/             캐릭터·배경(WebP), BGM — 오르페이아 철도 ADV의 그림을 줄여 옮김
```

## 대본에서 기출 부르기

```
@quiz 80-15 80-37          특정 문항
@quiz era=고려 n=3         시대에서 3문항(안 푼 문항 우선)
@quiz round=80             회차 전체
@if quizFirst >= 1 -> good 결과 분기 (quizFirst: 첫 시도 정답 수, quizTotal: 문항 수, quizAll: 이야기 누적)
```
대사 안의 `{quizFirst}` 같은 표시는 그 값으로 바뀐다.
