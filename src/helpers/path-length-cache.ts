// Cache độ dài thực tế (px) của từng đường SVG, dùng chung toàn bộ card.
// index.ts điền dữ liệu vào đây sau mỗi lần render (đo bằng
// path.getTotalLength()); render-circle.ts đọc từ đây để tự động điều
// chỉnh tốc độ animation (dur) theo độ dài thực tế của đường tương ứng —
// không cần sửa từng lệnh gọi renderCircle() rải rác khắp các file.
//
// Nguyên tắc: tốc độ (px/giây) tỉ lệ với % công suất, KHÔNG phụ thuộc độ
// dài đường. Đường dài hơn phải tốn NHIỀU THỜI GIAN hơn để đi hết (cùng
// tốc độ), không phải cùng thời gian bất kể độ dài.

// Độ dài tham chiếu (px): đường có độ dài đúng bằng giá trị này thì giữ
// nguyên hành vi gốc (dur = giá trị tính theo % công suất, không điều
// chỉnh gì thêm).
export const REFERENCE_PATH_LENGTH = 100;

export const pathLengthCache: Map<string, number> = new Map();

/**
 * Trả về "dur" (giây) đã điều chỉnh theo độ dài thực tế của đường có id
 * tương ứng, giữ tốc độ (px/giây) nhất quán giữa các đường dài/ngắn khác
 * nhau ở cùng 1 mức % công suất — đường dài hơn thì dur lớn hơn theo đúng
 * tỉ lệ (không giới hạn/làm tròn). Nếu chưa đo được độ dài (lần render đầu
 * tiên, path chưa vào DOM), trả về đúng baseDuration gốc.
 * @param baseDuration - dur gốc (giây), tính theo % công suất như hiện tại.
 * @param mpathHref - giá trị href của <mpath> (dạng "#path-id" hoặc "path-id").
 */
export function adjustDurationForPathLength(
	baseDuration: number,
	mpathHref: string,
): number {
	if (!mpathHref) return baseDuration;
	const id = mpathHref.startsWith('#') ? mpathHref.slice(1) : mpathHref;
	const length = pathLengthCache.get(id);
	if (!length) return baseDuration;
	const ratio = length / REFERENCE_PATH_LENGTH;
	if (!Number.isFinite(ratio) || ratio <= 0) return baseDuration;
	return baseDuration * ratio;
}

/**
 * Trả về độ dài thực tế (px) đã đo được của đường có id tương ứng, hoặc
 * undefined nếu chưa đo được (lần render đầu tiên, path chưa vào DOM).
 * @param mpathHref - giá trị href của <mpath> (dạng "#path-id" hoặc "path-id").
 */
export function getPathLength(mpathHref: string): number | undefined {
	if (!mpathHref) return undefined;
	const id = mpathHref.startsWith('#') ? mpathHref.slice(1) : mpathHref;
	return pathLengthCache.get(id);
}
