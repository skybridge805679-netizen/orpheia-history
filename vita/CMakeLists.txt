# 오르페이아 · 한국사 — PS Vita 실행기
#   PC:   cmake -S vita -B vita/build-pc && cmake --build vita/build-pc
#         ./vita/build-pc/orpheia vita/build-data/data/
#   Vita: cmake -S vita -B vita/build-vita -DCMAKE_TOOLCHAIN_FILE=$VITASDK/share/vita.toolchain.cmake
#         cmake --build vita/build-vita   → orpheia.vpk
# 데이터(vita/build-data)는 먼저 python3 tools/export-vita.py 로 만든다.
cmake_minimum_required(VERSION 3.16)

if(DEFINED ENV{VITASDK} AND CMAKE_TOOLCHAIN_FILE MATCHES "vita")
  include("$ENV{VITASDK}/share/vita.cmake" REQUIRED)
endif()

project(orpheia CXX C)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(DATA_DIR "${CMAKE_CURRENT_SOURCE_DIR}/build-data" CACHE PATH "tools/export-vita.py 출력 폴더")
add_executable(orpheia src/main.cpp)

if(VITA)
  set(VITA_APP_NAME "Orpheia History")
  set(VITA_TITLEID  "ORPH00001")
  set(VITA_VERSION  "00.01")
  # 그림·글꼴이 많아 기본 메모리보다 넉넉히 잡는다(이후 단계에서 조정)
  set(VITA_MKSFOEX_FLAGS "${VITA_MKSFOEX_FLAGS} -d ATTRIBUTE2=12")

  target_compile_options(orpheia PRIVATE -O2 -Wall)
  target_include_directories(orpheia PRIVATE $ENV{VITASDK}/arm-vita-eabi/include/SDL2)
  target_link_libraries(orpheia
    SDL2_ttf SDL2_image SDL2
    vitaGL vitashark SceShaccCgExt mathneon SceShaccCg_stub taihen_stub SceRazorCapture_stub
    freetype harfbuzz freetype png jpeg webp webpdemux bz2 z
    SceDisplay_stub SceCtrl_stub SceAudio_stub SceAudioIn_stub SceSysmodule_stub
    SceGxm_stub SceCommonDialog_stub SceAppUtil_stub SceTouch_stub SceHid_stub
    SceMotion_stub SceIme_stub SceKernelDmacMgr_stub ScePower_stub
    pthread m)

  vita_create_self(eboot.bin orpheia UNSAFE)

  # data/ 와 sce_sys/ 를 VPK에 통째로 넣는다
  set(VPK_FILES "")
  file(GLOB_RECURSE ALL_DATA RELATIVE "${DATA_DIR}" "${DATA_DIR}/data/*" "${DATA_DIR}/sce_sys/*")
  foreach(f ${ALL_DATA})
    list(APPEND VPK_FILES FILE "${DATA_DIR}/${f}" "${f}")
  endforeach()
  vita_create_vpk(orpheia.vpk ${VITA_TITLEID} eboot.bin
    VERSION ${VITA_VERSION}
    NAME ${VITA_APP_NAME}
    ${VPK_FILES})
else()
  find_package(PkgConfig REQUIRED)
  pkg_check_modules(SDL REQUIRED IMPORTED_TARGET sdl2 SDL2_image SDL2_ttf)
  target_compile_options(orpheia PRIVATE -O2 -Wall -Wextra)
  target_link_libraries(orpheia PkgConfig::SDL)
endif()
