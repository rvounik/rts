export default function PrintText(context, text, x, y, colour, fontStyle) {
    context.fillStyle = colour;
    context.font = fontStyle;
    context.textAlign='center';
    context.fillText(text, x, y);
}
