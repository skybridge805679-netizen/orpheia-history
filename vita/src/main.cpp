// 오르페이아 · 한국사 — PS Vita 실행기 (0단계: 첫 화면)
// 같은 코드를 PC(SDL2)와 PS Vita(VitaSDK)에서 빌드한다. docs/비타-포팅-계획.md
//
// 조작(확정): ○ 확인·다음, × 취소·이전. PC에서는 Enter/Space/Z = ○, Esc/X/Backspace = ×.
// 앞 터치는 화면 아무 곳이나 누르면 ○. 뒤 터치패드는 쓰지 않는다.
// 시험용: ORPH_SHOT=파일.bmp ORPH_STEPS=n 이면 ○를 n번 누른 뒤 한 장면을 찍고 끝낸다.
#include <SDL.h>
#include <SDL_image.h>
#include <SDL_ttf.h>
#include <cstdio>
#include <cstdlib>
#include <string>
#include <vector>

#ifdef __vita__
#include <psp2/kernel/processmgr.h>
static const char* DATA = "app0:data/";
// SDL 비타 조이스틱 버튼 번호
enum { VB_TRIANGLE = 0, VB_CIRCLE = 1, VB_CROSS = 2, VB_SQUARE = 3, VB_L = 4, VB_R = 5,
       VB_DOWN = 6, VB_LEFT = 7, VB_UP = 8, VB_RIGHT = 9, VB_SELECT = 10, VB_START = 11 };
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

// UTF-8 글자 n개까지의 바이트 길이
static size_t utf8Prefix(const std::string& s, size_t chars) {
  size_t i = 0, c = 0;
  while (i < s.size() && c < chars) {
    unsigned char b = s[i];
    i += (b < 0x80) ? 1 : (b < 0xE0) ? 2 : (b < 0xF0) ? 3 : 4;
    ++c;
  }
  return i > s.size() ? s.size() : i;
}
static size_t utf8Count(const std::string& s) {
  size_t c = 0;
  for (unsigned char b : s) if ((b & 0xC0) != 0x80) ++c;
  return c;
}

static SDL_Texture* loadTex(SDL_Renderer* r, const char* rel) {
  SDL_Texture* t = IMG_LoadTexture(r, path(rel).c_str());
  if (!t) SDL_Log("그림을 못 읽음 %s: %s", rel, IMG_GetError());
  return t;
}

static SDL_Texture* textTex(SDL_Renderer* r, TTF_Font* f, const std::string& s, SDL_Color c, int wrap, int* w, int* h) {
  if (s.empty()) { *w = *h = 0; return nullptr; }
  SDL_Surface* sf = TTF_RenderUTF8_Blended_Wrapped(f, s.c_str(), c, wrap);
  if (!sf) return nullptr;
  SDL_Texture* t = SDL_CreateTextureFromSurface(r, sf);
  *w = sf->w; *h = sf->h;
  SDL_FreeSurface(sf);
  return t;
}

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
#endif
  if (SDL_Init(SDL_INIT_VIDEO | SDL_INIT_JOYSTICK) != 0) { SDL_Log("SDL_Init: %s", SDL_GetError()); return 1; }
  IMG_Init(IMG_INIT_PNG | IMG_INIT_JPG);
  TTF_Init();
  const char* shot = getenv("ORPH_SHOT");
  int steps = getenv("ORPH_STEPS") ? atoi(getenv("ORPH_STEPS")) : 0;

  SDL_Window* win = SDL_CreateWindow("오르페이아 · 한국사", SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED, W, H,
                                     shot ? SDL_WINDOW_HIDDEN : 0);
  SDL_Renderer* ren = SDL_CreateRenderer(win, -1, shot ? SDL_RENDERER_SOFTWARE : (SDL_RENDERER_ACCELERATED | SDL_RENDERER_PRESENTVSYNC));
  if (!ren) ren = SDL_CreateRenderer(win, -1, SDL_RENDERER_SOFTWARE);
  SDL_SetRenderDrawBlendMode(ren, SDL_BLENDMODE_BLEND);
  if (SDL_NumJoysticks() > 0) SDL_JoystickOpen(0);

  TTF_Font* body = TTF_OpenFont(path("fonts/GowunDodum-Regular.ttf").c_str(), 23);
  TTF_Font* name = TTF_OpenFont(path("fonts/GowunBatang-Bold.ttf").c_str(), 21);
  TTF_Font* title = TTF_OpenFont(path("fonts/GowunBatang-Bold.ttf").c_str(), 40);
  if (!body || !name || !title) { SDL_Log("글꼴을 못 읽음: %s", TTF_GetError()); return 1; }

  SDL_Texture* bg = loadTex(ren, "img/bg_title.jpg");
  SDL_Texture* emblem = loadTex(ren, "img/emblem.png");
  SDL_Texture* orp = loadTex(ren, "img/orpheia.png");

  size_t idx = 0;          // 지금 대사
  double shown = 0;        // 보이는 글자 수(타자 효과)
  const double CPS = 36;   // 초당 글자
  std::string cached; SDL_Texture* txt = nullptr; int tw = 0, th = 0;
  int nw = 0, nh = 0; SDL_Texture* nameTex = textTex(ren, name, LINES[0].who, {255, 255, 255, 255}, 400, &nw, &nh);
  int ttw = 0, tth = 0; SDL_Texture* titleTex = textTex(ren, title, "오르페이아 · 한국사", {250, 240, 220, 255}, 900, &ttw, &tth);
  int sw = 0, sh = 0; SDL_Texture* subTex = textTex(ren, body, "PS Vita 포팅 · 0단계", {210, 225, 255, 255}, 900, &sw, &sh);

  auto confirm = [&]() {
    const std::string full = LINES[idx].text;
    if ((size_t)shown < utf8Count(full)) { shown = 1e9; return; }   // 타자 중이면 끝까지
    idx = (idx + 1) % LINES.size(); shown = 0;
  };
  auto cancel = [&]() { if (idx > 0) { --idx; shown = 1e9; } };

  bool run = true; Uint32 last = SDL_GetTicks();
  int frames = 0;
  while (run) {
    SDL_Event e;
    while (SDL_PollEvent(&e)) {
      if (e.type == SDL_QUIT) run = false;
#ifdef __vita__
      if (e.type == SDL_JOYBUTTONDOWN) {
        if (e.jbutton.button == VB_CIRCLE) confirm();
        else if (e.jbutton.button == VB_CROSS) cancel();
      }
      // 앞 터치만(뒤 터치패드는 쓰지 않는다)
      if (e.type == SDL_FINGERDOWN && e.tfinger.touchId == SDL_GetTouchDevice(0)) confirm();
#else
      if (e.type == SDL_KEYDOWN) {
        SDL_Keycode k = e.key.keysym.sym;
        if (k == SDLK_RETURN || k == SDLK_SPACE || k == SDLK_z) confirm();
        else if (k == SDLK_ESCAPE || k == SDLK_x || k == SDLK_BACKSPACE) cancel();
      }
      if (e.type == SDL_MOUSEBUTTONDOWN && e.button.button == SDL_BUTTON_LEFT) confirm();
#endif
    }
    Uint32 now = SDL_GetTicks(); shown += (now - last) / 1000.0 * CPS; last = now;
    if (shot) { shown = 1e9; if (frames == 0) for (int i = 0; i < steps; ++i) { confirm(); shown = 1e9; } }

    const std::string full = LINES[idx].text;
    std::string vis = full.substr(0, utf8Prefix(full, (size_t)shown));
    if (vis != cached) {
      if (txt) SDL_DestroyTexture(txt);
      txt = textTex(ren, body, vis, {40, 34, 30, 255}, 800, &tw, &th);
      cached = vis;
    }

    SDL_SetRenderDrawColor(ren, 12, 14, 28, 255);
    SDL_RenderClear(ren);
    if (bg) { SDL_Rect d = {-64, -36, 1088, 616}; SDL_RenderCopy(ren, bg, nullptr, &d); }
    SDL_SetRenderDrawColor(ren, 6, 8, 20, 90); SDL_Rect dim = {0, 0, W, H}; SDL_RenderFillRect(ren, &dim);
    if (emblem) { int ew, eh; SDL_QueryTexture(emblem, nullptr, nullptr, &ew, &eh); SDL_Rect d = {40, 28, ew * 70 / eh, 70}; SDL_RenderCopy(ren, emblem, nullptr, &d); }
    if (titleTex) { SDL_Rect d = {130, 30, ttw, tth}; SDL_RenderCopy(ren, titleTex, nullptr, &d); }
    if (subTex) { SDL_Rect d = {132, 30 + tth, sw, sh}; SDL_RenderCopy(ren, subTex, nullptr, &d); }
    if (orp) { int ow, oh; SDL_QueryTexture(orp, nullptr, nullptr, &ow, &oh); SDL_Rect d = {W - ow - 30, H - oh + 40, ow, oh}; SDL_RenderCopy(ren, orp, nullptr, &d); }

    // 대사창(웹판의 종이 질감 대신 단색 + 테두리)
    SDL_Rect box = {40, H - 168, W - 80, 140};
    fillRound(ren, box, {244, 236, 222, 238});
    SDL_SetRenderDrawColor(ren, 120, 96, 70, 255); SDL_Rect bd = {box.x + 6, box.y + 6, box.w - 12, box.h - 12}; SDL_RenderDrawRect(ren, &bd);
    SDL_Rect tag = {box.x + 28, box.y - 20, nw + 32, nh + 10};
    fillRound(ren, tag, {29, 92, 85, 255});
    if (nameTex) { SDL_Rect d = {tag.x + 16, tag.y + 5, nw, nh}; SDL_RenderCopy(ren, nameTex, nullptr, &d); }
    if (txt) { SDL_Rect d = {box.x + 36, box.y + 30, tw, th}; SDL_RenderCopy(ren, txt, nullptr, &d); }
    if ((size_t)shown >= utf8Count(full) && (now / 400) % 2) {  // ▼ 깜빡임
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
    ++frames;
  }
  TTF_Quit(); IMG_Quit(); SDL_Quit();
#ifdef __vita__
  sceKernelExitProcess(0);
#endif
  return 0;
}
