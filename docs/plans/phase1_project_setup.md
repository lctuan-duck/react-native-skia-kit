# Phase 1: Project Setup & Dependencies

## Mục tiêu
Khởi tạo monorepo: package source (`src/`) + example app (`example/`) + build pipeline.

## Checklist
- [x] Tạo root `package.json` với workspaces + `react-native-builder-bob`
- [x] Tạo `tsconfig.json` + `tsconfig.build.json`
- [x] Tạo `src/index.ts` entry point (export rỗng ban đầu)
- [x] Tạo example app với RN CLI
- [x] Setup `example/metro.config.js` — watch `../src/`, resolve package
- [x] Setup `example/babel.config.js` — reanimated plugin
- [x] Install peer deps: `@shopify/react-native-skia`, `react-native-reanimated`, `react-native-gesture-handler`
- [x] Install deps: `zustand`, `immer`, `yoga-layout-prebuilt`
- [x] Verify: `yarn build` chạy thành công
- [x] Verify: `yarn example:android` chạy + hot reload khi sửa `src/`

## Dependencies

### Peer Dependencies (user app phải install)
| Package | Version | Mục đích |
|---------|---------|----------|
| `@shopify/react-native-skia` | `>=1.0.0` | Skia Canvas rendering |
| `react-native-reanimated` | `>=3.0.0` | Animation engine |
| `react-native-gesture-handler` | `>=2.0.0` | Gesture processing |
| `react` | `>=18.0.0` | React |
| `react-native` | `>=0.72.0` | React Native |

### Dependencies (bundle cùng package)
| Package | Version | Mục đích |
|---------|---------|----------|
| `zustand` | `^5.0.0` | State management (stores) |
| `immer` | `^10.1.0` | Immutable state updates |
| `yoga-layout-prebuilt` | `^1.10.0` | Flex layout engine |

### Dev Dependencies
| Package | Version | Mục đích |
|---------|---------|----------|
| `react-native-builder-bob` | `^0.35.0` | Package builder |
| `typescript` | `^5.4.0` | TypeScript compiler |

## Chi tiết setup
→ Xem [setup-guide.md](../setup-guide.md) để biết đầy đủ config files.

## Nguồn tham khảo
- [react-native-builder-bob](https://github.com/callstack/react-native-builder-bob)
- [React Native Skia](https://shopify.github.io/react-native-skia/)
- [Yoga Layout](https://www.yogalayout.dev/docs/about-yoga)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)
