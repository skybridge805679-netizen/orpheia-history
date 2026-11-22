// 오르페이아 · 한국사 — PS Vita 실행기 (0단계: 첫 화면)
// 같은 코드를 PC(SDL2)와 PS Vita(VitaSDK)에서 빌드한다. docs/비타-포팅-계획.md
//
// 조작(확정): ○ 확인·다음, × 취소·이전. PC에서는 Enter/Space/Z = ○, Esc/X/Backspace = ×.
// 앞 터치는 화면 아무 곳이나 누르면 ○. 뒤 터치패드는 쓰지 않는다.
// 비타 버튼은 SDL 조이스틱 이벤트 대신 sceCtrl 로 매 프레임 직접 읽는다(실기에서 SDL 이벤트가 안 옴).
// 시험용: ORPH_SHOT=파일.bmp ORPH_STEPS=n ORPH_REVEAL=글자수 → 장면 한 장을 찍고 끝낸다.
#include <SDL.h>
#include <SDL_image.h>
#include <SDL_ttf.h>
#include <cstdio>
#include <cstdlib>
#include <string>
#include <vector>

#ifdef __vita__
#include <psp2/ctrl.h>
#include <psp2/kernel/processmgr.h>
static const char* DATA = "app0:data/";
#else
static std::string DATA_DIR;
#endif

static const int W = 960, H = 544;

static std::string path(const char* rel) {
#ifdef __vita__
  return std::string(DATA) + rel;
#else
  return DATA_DIR + rel;
#endif
}

struct Line { const char* who; const char* text; };
static const std::vector<Line> LINES = {
  {"오르페이아", "어서 오세요, 주인님. 여기는…… 게임기 안이네요?"},
  {"오르페이아", "LV.99 전뇌시녀 오르페이아, 손바닥만 한 화면으로 이사 왔어요. 화면은 작아도 보좌는 그대로예요."},
  {"오르페이아", "확인은 ○, 취소는 ×. 뒤쪽 터치패드는 안 쓰기로 하셨죠? 기억해 둘게요."},
  {"오르페이아", "아직은 첫 화면뿐이에요. 다음엔 대본을 읽는 엔진을 짓고, 그다음엔 기출 문제를 들고 올게요."},
  {"오르페이아", "……후후. 주인님 손 안에서 연표를 다시 펼칠 날, 기대하고 있을게요."},
};

// UTF-8 글자 단위로 자른다
static std::vector<std::string> utf8Chars(const std::string& s) {
  std::vector<std::string> out;
  for (size_t i = 0; i < s.size();) {
    unsigned char b = s[i];
    size_t n = (b < 0x80) ? 1 : (b < 0xE0) ? 2 : (b < 0xF0) ? 3 : 4;
    out.push_back(s.substr(i, n));
    i += n;
  }
  return out;
}

static SDL_Texture* loadTex(SDL_Renderer* r, const char* rel) {
  SDL_Texture* t = IMG_LoadTexture(r, path(rel).c_str());
  if (!t) SDL_Log("그림을 못 읽음 %s: %s", rel, IMG_GetError());
  return t;
}

static SDL_Texture* textTex(SDL_Renderer* r, TTF_Font* f, const std::string& s, SDL_Color c, int* w, int* h) {
  if (s.empty()) { *w = *h = 0; return nullptr; }
  SDL_Surface* sf = TTF_RenderUTF8_Blended(f, s.c_str(), c);
  if (!sf) return nullptr;
  SDL_Texture* t = SDL_CreateTextureFromSurface(r, sf);
  *w = sf->w; *h = sf->h;
  SDL_FreeSurface(sf);
  return t;
}

// 대사 한 줄을 한 번만 그려 두고, 보이는 글자 수만큼 잘라서 보여 준다(타자 효과).
// 매 글자마다 글꼴을 다시 그리지 않으므로 비타에서도 60fps로 매끄럽다.
struct TypedText {
  struct Row { SDL_Texture* tex = nullptr; int w = 0, h = 0; int first = 0; std::vector<int> x; };  // x[k]: 줄 안 k번째 글자 끝 위치
  std::vector<Row> rows;
  int total = 0, lineH = 0;
  void clear() { for (auto& r : rows) if (r.tex) SDL_DestroyTexture(r.tex); rows.clear(); total = 0; }
  void build(SDL_Renderer* ren, TTF_Font* f, const std::string& text, int maxW, SDL_Color c) {
    clear();
    lineH = TTF_FontLineSkip(f);
    std::vector<std::string> ch = utf8Chars(text);
    total = (int)ch.size();
    size_t i = 0;
    while (i < ch.size()) {
      // 이 줄에 들어갈 만큼 글자를 담는다(넘치면 마지막 공백에서 끊는다)
      std::string cur; size_t j = i, lastSpace = std::string::npos;
      while (j < ch.size()) {
        std::string t = cur + ch[j]; int tw = 0;
        TTF_SizeUTF8(f, t.c_str(), &tw, nullptr);
        if (tw > maxW && j > i) break;
        cur = t; if (ch[j] == " ") lastSpace = j; ++j;
      }
      if (j < ch.size() && lastSpace != std::string::npos && lastSpace > i) j = lastSpace + 1;
      Row r; r.first = (int)i;
      std::string acc;
      for (size_t k = i; k < j; ++k) { acc += ch[k]; int tw = 0; TTF_SizeUTF8(f, acc.c_str(), &tw, nullptr); r.x.push_back(tw); }
      r.tex = textTex(ren, f, acc, c, &r.w, &r.h);
      rows.push_back(r);
      i = j;
    }
  }
  // shown: 보이는 글자 수(소수점은 막 나타나는 글자의 진하기)
  void draw(SDL_Renderer* ren, int x, int y, double shown) const {
    for (size_t n = 0; n < rows.size(); ++n) {
      const Row& r = rows[n];
      if (!r.tex) continue;
      int k = (int)shown - r.first;  // 이 줄에서 다 보이는 글자 수
      if (k <= 0 && shown - r.first <= 0) break;
      int full = k > (int)r.x.size() ? (int)r.x.size() : k;
      int wFull = full > 0 ? r.x[full - 1] : 0;
      SDL_Rect s = {0, 0, wFull, r.h}, d = {x, y + (int)n * lineH, wFull, r.h};
      SDL_SetTextureAlphaMod(r.tex, 255);
      if (wFull > 0) SDL_RenderCopy(ren, r.tex, &s, &d);
      if (full < (int)r.x.size()) {  // 막 나타나는 글자는 반투명하게
        double frac = shown - r.first - full;
        if (frac > 0) {
          int x1 = r.x[full];
          SDL_Rect s2 = {wFull, 0, x1 - wFull, r.h}, d2 = {x + wFull, y + (int)n * lineH, x1 - wFull, r.h};
          SDL_SetTextureAlphaMod(r.tex, (Uint8)(255 * frac));
          SDL_RenderCopy(ren, r.tex, &s2, &d2);
          SDL_SetTextureAlphaMod(r.tex, 255);
        }
        break;
      }
    }
  }
};

static void fillRound(SDL_Renderer* r, SDL_Rect a, SDL_Color c) {
  SDL_SetRenderDrawColor(r, c.r, c.g, c.b, c.a);
  SDL_Rect in = {a.x + 4, a.y, a.w - 8, a.h};
  SDL_RenderFillRect(r, &in);
  SDL_Rect side = {a.x, a.y + 4, a.w, a.h - 8};
  SDL_RenderFillRect(r, &side);
}

int main(int argc, char** argv) {
#ifndef __vita__
  DATA_DIR = (argc > 1) ? std::string(argv[1]) : std::string("build-data/data/");
  if (DATA_DIR.back() != '/') DATA_DIR += '/';
#else
  (void)argc; (void)argv;
  sceCtrlSetSamplingMode(SCE_CTRL_MODE_ANALOG);
#endif
  if (SDL_Init(SDL_INIT_VIDEO) != 0) { SDL_Log("SDL_Init: %s", SDL_GetError()); return 1; }
  IMG_Init(IMG_INIT_PNG | IMG_INIT_JPG);
  TTF_Init();
  const char* shot = getenv("ORPH_SHOT");
  int steps = getenv("ORPH_STEPS") ? atoi(getenv("ORPH_STEPS")) : 0;
  double reveal = getenv("ORPH_REVEAL") ? atof(getenv("ORPH_REVEAL")) : 1e9;

  SDL_Window* win = SDL_CreateWindow("오르페이아 · 한국사", SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED, W, H,
                                     shot ? SDL_WINDOW_HIDDEN : 0);
  SDL_Renderer* ren = SDL_CreateRenderer(win, -1, shot ? SDL_RENDERER_SOFTWARE : (SDL_RENDERER_ACCELERATED | SDL_RENDERER_PRESENTVSYNC));
  if (!ren) ren = SDL_CreateRenderer(win, -1, SDL_RENDERER_SOFTWARE);
  SDL_SetRenderDrawBlendMode(ren, SDL_BLENDMODE_BLEND);

  TTF_Font* body = TTF_OpenFont(path("fonts/GowunDodum-Regular.ttf").c_str(), 24);
  TTF_Font* name = TTF_OpenFont(path("fonts/GowunBatang-Bold.ttf").c_str(), 21);
  TTF_Font* title = TTF_OpenFont(path("fonts/GowunBatang-Bold.ttf").c_str(), 40);
  if (!body || !name || !title) { SDL_Log("글꼴을 못 읽음: %s", TTF_GetError()); return 1; }

  SDL_Texture* bg = loadTex(ren, "img/bg_title.jpg");
  SDL_Texture* emblem = loadTex(ren, "img/emblem.png");
  SDL_Texture* orp = loadTex(ren, "img/orpheia.png");

  size_t idx = 0;            // 지금 대사
  double shown = 0;          // 보이는 글자 수(타자 효과, 소수점까지)
  const double CPS = 40;     // 초당 글자
  TypedText typed;
  const SDL_Color INK = {40, 34, 30, 255};
  const int BOX_X = 40, BOX_W = W - 80, TEXT_W = BOX_W - 72;
  typed.build(ren, body, LINES[idx].text, TEXT_W, INK);
  int nw = 0, nh = 0; SDL_Texture* nameTex = textTex(ren, name, LINES[0].who, {255, 255, 255, 255}, &nw, &nh);
  int ttw = 0, tth = 0; SDL_Texture* titleTex = textTex(ren, title, "오르페이아 · 한국사", {250, 240, 220, 255}, &ttw, &tth);
  int sw = 0, sh = 0; SDL_Texture* subTex = textTex(ren, body, "PS Vita 포팅 · 0단계", {210, 225, 255, 255}, &sw, &sh);

  auto setLine = [&](size_t i, bool instant) { idx = i; shown = instant ? 1e9 : 0; typed.build(ren, body, LINES[idx].text, TEXT_W, INK); };
  auto confirm = [&]() {
    if (shown < typed.total) { shown = 1e9; return; }   // 타자 중이면 끝까지
    setLine((idx + 1) % LINES.size(), false);
  };
  auto cancel = [&]() { if (idx > 0) setLine(idx - 1, true); };

#ifdef __vita__
  unsigned int prevButtons = 0;
#endif
  bool run = true; Uint32 last = SDL_GetTicks();
  if (shot) { for (int i = 0; i < steps; ++i) { shown = 1e9; confirm(); } shown = reveal; }
  while (run) {
    SDL_Event e;
    while (SDL_PollEvent(&e)) {
      if (e.type == SDL_QUIT) run = false;
#ifdef __vita__
      // 앞 터치만(뒤 터치패드는 쓰지 않는다)
      if (e.type == SDL_FINGERDOWN && e.tfinger.touchId == SDL_GetTouchDevice(0)) confirm();
#else
      if (e.type == SDL_KEYDOWN && !e.key.repeat) {
        SDL_Keycode k = e.key.keysym.sym;
        if (k == SDLK_RETURN || k == SDLK_SPACE || k == SDLK_z) confirm();
        else if (k == SDLK_ESCAPE || k == SDLK_x || k == SDLK_BACKSPACE) cancel();
      }
      if (e.type == SDL_MOUSEBUTTONDOWN && e.button.button == SDL_BUTTON_LEFT) confirm();
#endif
    }
#ifdef __vita__
    SceCtrlData pad;
    if (sceCtrlPeekBufferPositive(0, &pad, 1) > 0) {
      unsigned int down = pad.buttons & ~prevButtons;   // 이번 프레임에 새로 눌린 버튼
      if (down & SCE_CTRL_CIRCLE) confirm();
      if (down & SCE_CTRL_CROSS) cancel();
      prevButtons = pad.buttons;
    }
#endif
    Uint32 now = SDL_GetTicks();
    if (!shot) shown += (now - last) / 1000.0 * CPS;
    last = now;

    SDL_SetRenderDrawColor(ren, 12, 14, 28, 255);
    SDL_RenderClear(ren);
    if (bg) { SDL_Rect d = {-64, -36, 1088, 616}; SDL_RenderCopy(ren, bg, nullptr, &d); }
    SDL_SetRenderDrawColor(ren, 6, 8, 20, 90); SDL_Rect dim = {0, 0, W, H}; SDL_RenderFillRect(ren, &dim);
    if (emblem) { int ew, eh; SDL_QueryTexture(emblem, nullptr, nullptr, &ew, &eh); SDL_Rect d = {40, 28, ew * 70 / eh, 70}; SDL_RenderCopy(ren, emblem, nullptr, &d); }
    if (titleTex) { SDL_Rect d = {130, 30, ttw, tth}; SDL_RenderCopy(ren, titleTex, nullptr, &d); }
    if (subTex) { SDL_Rect d = {132, 30 + tth, sw, sh}; SDL_RenderCopy(ren, subTex, nullptr, &d); }
    // 스탠딩: 웹판처럼 크게(무릎 아래는 화면 밖)
    if (orp) { int ow, oh; SDL_QueryTexture(orp, nullptr, nullptr, &ow, &oh); SDL_Rect d = {W - ow + 10, 18, ow, oh}; SDL_RenderCopy(ren, orp, nullptr, &d); }

    // 대사창(웹판의 종이 질감 대신 단색 + 테두리)
    SDL_Rect box = {BOX_X, H - 168, BOX_W, 140};
    fillRound(ren, box, {244, 236, 222, 238});
    SDL_SetRenderDrawColor(ren, 120, 96, 70, 255); SDL_Rect bd = {box.x + 6, box.y + 6, box.w - 12, box.h - 12}; SDL_RenderDrawRect(ren, &bd);
    SDL_Rect tag = {box.x + 28, box.y - 20, nw + 32, nh + 10};
    fillRound(ren, tag, {29, 92, 85, 255});
    if (nameTex) { SDL_Rect d = {tag.x + 16, tag.y + 5, nw, nh}; SDL_RenderCopy(ren, nameTex, nullptr, &d); }
    typed.draw(ren, box.x + 36, box.y + 28, shown);
    if (shown >= typed.total && (now / 400) % 2) {  // ▼ 깜빡임
      SDL_SetRenderDrawColor(ren, 179, 38, 30, 255);
      for (int i = 0; i < 8; ++i) { SDL_Rect t = {box.x + box.w - 44 + i, box.y + box.h - 30 + i, 16 - 2 * i, 1}; SDL_RenderFillRect(ren, &t); }
    }

    if (shot) {
      SDL_Surface* s = SDL_CreateRGBSurfaceWithFormat(0, W, H, 32, SDL_PIXELFORMAT_ARGB8888);
      SDL_RenderReadPixels(ren, nullptr, SDL_PIXELFORMAT_ARGB8888, s->pixels, s->pitch);
      SDL_SaveBMP(s, shot); SDL_FreeSurface(s);
      run = false;
    }
    SDL_RenderPresent(ren);
  }
  typed.clear();
  TTF_Quit(); IMG_Quit(); SDL_Quit();
#ifdef __vita__
  sceKernelExitProcess(0);
#endif
  return 0;
}
