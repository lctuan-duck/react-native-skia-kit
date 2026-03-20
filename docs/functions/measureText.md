# measureText Function

## Mục đích
- Đo đạc chính xác kích thước bao bọc (Width, Height) mà văn bản sẽ chiếm trước khi được vẽ bằng Skia.
- Gửi dữ liệu này sang Engine bố cục (Yoga Layout) để tính box-model đẩy layout đúng đắn.

## API Documentation

```tsx
import { measureText } from 'react-native-skia-kit/functions';

const { width, height } = measureText(
    "Văn bản đa dòng dài thòng lọng...", 
    { 
        fontSize: 14, 
        fontFamily: 'System',
        fontWeight: 'bold', 
        maxWidth: 250 // Để text tự bẻ dòng
    }
);
```

## Tích hợp trong Skia Kit Layout Engine

Do Skia rendering không tự xếp cạnh nhau như HTML DOM, Skia Kit dùng Yoga Engine tính layout. Tuy nhiên Yoga không biết một đoạn text `Hello` dài bao nhiêu pixel để chừa chỗ. Hàm này là cầu nối:

```tsx
// Trong lúc layoutStore xử lý Yoga Tree
function calculateNodeLayout(widget) {
   if (widget.type === 'Text') {
      const size = measureText(widget.props.text, widget.props.style);
      yogaNode.setWidth(size.width);
      yogaNode.setHeight(size.height);
   }
}
```

## Internal Code
```ts
import { Skia } from '@shopify/react-native-skia';

export function measureText(text, { fontSize = 14, fontWeight = 'normal', fontFamily = 'System', maxWidth = 10000 }) {
   const p = Skia.ParagraphBuilder.Make({ maxLines: 999 }, Skia.FontMgr.System())
      .pushStyle({
          color: Skia.Color('black'),
          fontSize,
          fontFamilies: [fontFamily],
          fontStyle: { weight: fontWeight === 'bold' ? 700 : 400 },
      })
      .addText(text)
      .pop()
      .build();

   p.layout(maxWidth);

   return {
      width: p.getMaxIntrinsicWidth(),
      height: p.getHeight()
   };
}
```
