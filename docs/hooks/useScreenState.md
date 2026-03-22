# useScreenState Hook

## Mục đích
- Lưu và khôi phục trạng thái screen khi chuyển navigation.
- Tự động save khi screen unmount, tự động restore khi screen mount lại.

## Flutter tương đương
- `RestorationMixin`, `AutomaticKeepAliveClientMixin`

## API

```tsx
import { useScreenState } from 'react-native-skia-kit';

function OrderScreen() {
  const [state, setState] = useScreenState('order', {
    scrollOffset: 0,
    selectedCategory: 'all',
    searchText: '',
  });

  // state.scrollOffset — tự động được khôi phục khi navigate back
  // setState({ scrollOffset: 100 }) — cập nhật và lưu ngay

  return (
    <ScrollView onScroll={(offset) => setState({ scrollOffset: offset })}>
      ...
    </ScrollView>
  );
}
```

## TypeScript Interface

```ts
function useScreenState<T extends Record<string, any>>(
  screenName: string,
  initialState: T
): [T, (partial: Partial<T>) => void];
```

### Parameters
| Param | Type | Mô tả |
|-------|------|-------|
| `screenName` | `string` | Tên screen để lưu state |
| `initialState` | `T` | State mặc định khi chưa có dữ liệu lưu |

### Returns
| Index | Type | Mô tả |
|-------|------|-------|
| `[0]` | `T` | State hiện tại (đã restore nếu có) |
| `[1]` | `(partial) => void` | Update state (merge partial) |

## Hoạt động

```
Screen A mount  → useScreenState('A', defaultState)
                → Check navStore.stateMap['A']
                → Có? → Merge với defaultState → return
                → Không? → return defaultState

Screen A unmount → navStore.saveScreenState('A', currentState)

Navigate back to A → mount lại → restore state
```

## Quan hệ với navStore

`useScreenState` là convenience wrapper cho:
- `navStore.saveScreenState(navId, screenName, state)`
- `navStore.restoreScreenState(navId, screenName)`

Bạn có thể dùng trực tiếp navStore nếu không cần hook.

## Nguồn tham khảo
- [Flutter RestorationMixin](https://api.flutter.dev/flutter/widgets/RestorationMixin-mixin.html)
- [Flutter AutomaticKeepAliveClientMixin](https://api.flutter.dev/flutter/widgets/AutomaticKeepAliveClientMixin-mixin.html)
