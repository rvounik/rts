export default function LoadBitmap(obj, decreaseAssetCount) {
    obj['img'].onload = () => {
        decreaseAssetCount(obj['id']);
    };

    obj['img'].onerror = () => {
        console.log('FAILED TO LOAD ASSET, CHECK PATH FOR ' + obj['src']);
    };

    obj['img'].src = obj['src'];
}
