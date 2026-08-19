import { svg } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { Utils } from './utils';
import {
	adjustDurationForPathLength,
	getPathLength,
} from './path-length-cache';

// Khoảng cách mong muốn giữa 2 chấm liền kề (px) — số lượng chấm trên mỗi
// đường được TÍNH TỰ ĐỘNG theo độ dài thực tế của đường đó (đường dài có
// nhiều chấm hơn đường ngắn), không phải số cố định cho mọi đường.
const DOT_SPACING = 15;
// Đủ lớn để bao phủ đường dài nhất trong card (aux-line2 khi wide, ~280px,
// cần 19 chấm để giữ đúng 15px/chấm) — trước đây giới hạn ở 8 khiến các
// đường dài (grid-line, bat-line, solar-line, aux-line2...) bị kéo giãn
// khoảng cách chấm thực tế lên tới ~20-35px thay vì đúng 15px như thiết kế.
const MAX_DOTS = 20;
// Hệ số thu nhỏ đường kính chấm còn 2/3 so với bán kính gốc truyền vào.
const RADIUS_SCALE = 2 / 3;

/**
 * Renders one or more animated circles evenly spaced along a path,
 * simulating a continuous flow instead of a single dot.
 * @param id - The ID of the circle.
 * @param radius - The radius of the circle.
 * @param fill - The fill color of the circle (dùng khi cycleColours không có).
 * @param duration - The duration of the animation in seconds.
 * @param keyPoints - The key points for the animation (e.g., "1;0" or "0;1").
 * @param mpathHref - The ID of the path to follow (e.g., "#bat-line").
 * @param invertFlow - Whether to invert the animation flow (optional, default: false).
 * @param cycleColours - (tùy chọn) Mảng màu các nguồn đang đóng góp (VD
 *   [solarColour, batteryColour, gridColour]) -- mỗi DOT liên tiếp lấy màu
 *   theo thứ tự cycleColours[index % length], tạo hiệu ứng "DOT nối đuôi
 *   nhau đổi màu theo từng nguồn" khi công suất đang pha trộn nhiều nguồn.
 *   Nếu chỉ 1 nguồn đang hoạt động (mảng 1 phần tử) thì mọi DOT cùng 1 màu
 *   (giống hành vi cũ). Bỏ qua tham số này để giữ hành vi 1-màu-cố-định cũ.
 * @returns A Lit SVG template for the animated circle element(s).
 */
export const renderCircle = (
	id: string,
	radius: number,
	fill: string,
	duration: number,
	keyPoints: string,
	mpathHref: string,
	invertFlow: boolean = false,
	cycleColours?: string[],
) => {
	// If fill is transparent, skip rendering the animated dot entirely to avoid
	// running animations and triggering paints when power is zero or the flow is hidden.
	if (fill === 'transparent') {
		return svg``;
	}

	// Điều chỉnh "dur" theo độ dài thực tế của đường (mpathHref) — giữ tốc
	// độ (px/giây) nhất quán giữa các đường dài/ngắn khác nhau, đường dài
	// hơn tốn nhiều thời gian hơn để đi hết (cùng tốc độ), không phải cùng
	// thời gian bất kể độ dài.
	const adjustedDuration = adjustDurationForPathLength(duration, mpathHref);
	const finalKeyPoints = invertFlow
		? Utils.invertKeyPoints(keyPoints)
		: keyPoints;
	const scaledRadius = radius * RADIUS_SCALE;

	// Số chấm = độ dài thực tế / khoảng cách mong muốn, tối thiểu 1 (lần
	// render đầu tiên khi chưa đo được độ dài, mặc định 1 chấm như cũ).
	// KHÔNG ép tăng số chấm theo cycleColours.length nữa (từng làm ở bản
	// trước) vì làm sai khoảng cách DOT_SPACING=15px trên đường ngắn (nhồi
	// nhiều chấm hơn mức đường đó cho phép). Thay vào đó, nếu đường ngắn có
	// ÍT chấm hơn số phần tử trong cycleColours, ta RESAMPLE (lấy mẫu lại)
	// mảng màu theo đúng TỶ LỆ VỊ TRÍ để vẫn giữ đúng thứ tự/tỷ lệ các
	// nguồn, chỉ là "nén" lại cho vừa số chấm thực có -- xem hàm
	// resampleCycleColours bên dưới.
	const pathLen = getPathLength(mpathHref);
	const dotCount = pathLen
		? Math.min(MAX_DOTS, Math.max(1, Math.round(pathLen / DOT_SPACING)))
		: 1;

	// Làm tròn dur về 2 chữ số thập phân để làm "key" — chỉ ép tạo lại phần
	// tử khi dur đổi ĐÁNG KỂ (>0.005s), tránh tạo lại liên tục vì sai số
	// làm tròn cực nhỏ không đáng kể.
	const durationKey = Math.round(adjustedDuration * 100) / 100;

	// Lấy mẫu lại cycleColours (VD 5 phần tử theo tỷ lệ %) xuống đúng
	// dotCount thực tế của đường này, GIỮ ĐÚNG THỨ TỰ/TỶ LỆ các khối màu --
	// dùng vị trí tỷ lệ (i/dotCount * cycleColours.length) thay vì modulo
	// đơn giản, để 1 chấm/2 chấm trên đường ngắn vẫn phản ánh đúng nguồn nào
	// đang chiếm ưu thế thay vì lặp lại/cắt xén sai lệch.
	const resampledColours =
		cycleColours && cycleColours.length > 0
			? Array.from({ length: dotCount }, (_, i) => {
					const srcIdx = Math.min(
						cycleColours.length - 1,
						Math.floor((i * cycleColours.length) / dotCount),
					);
					return cycleColours[srcIdx];
				})
			: null;

	if (dotCount <= 1) {
		const singleFill = resampledColours ? resampledColours[0] : fill;
		return keyed(
			durationKey,
			svg`
            <circle id="${id}" cx="0" cy="0" r="${scaledRadius}" fill="${singleFill}">
                <animateMotion dur="${adjustedDuration}s" repeatCount="indefinite"
                    keyPoints="${finalKeyPoints}"
                    keyTimes="0;1" calcMode="linear">
                    <mpath href="${mpathHref}"/>
                </animateMotion>
            </circle>
        `,
		);
	}

	// Nhiều chấm cách đều: mỗi chấm dùng "begin" âm để bắt đầu animation
	// đã "chạy trước" 1 khoảng = (dur/dotCount)*index giây — tạo hiệu ứng
	// các chấm nối đuôi nhau cách đều dọc theo đường ngay từ khung hình đầu.
	// Bọc bằng keyed(durationKey, ...) để cả nhóm chấm được TẠO LẠI ĐỒNG BỘ
	// mỗi khi tốc độ đổi — tránh tình trạng W tăng/giảm nhanh liên tục làm
	// timeline SMIL của từng chấm lệch dần theo thời gian (dù tắt/mở lại
	// trang thì tự hết vì DOM được dựng sạch từ đầu, nhưng nếu không ép
	// tạo lại, việc Lit chỉ vá thuộc tính "dur"/"begin" tại chỗ có thể khiến
	// trình duyệt không reset đúng timeline nội bộ của animation).
	return keyed(
		durationKey,
		svg`${Array.from({ length: dotCount }, (_, i) => {
			const beginOffset = -((adjustedDuration * i) / dotCount);
			const dotFill = resampledColours ? resampledColours[i] : fill;
			return svg`
            <circle id="${id}-${i}" cx="0" cy="0" r="${scaledRadius}" fill="${dotFill}">
                <animateMotion dur="${adjustedDuration}s" repeatCount="indefinite"
                    begin="${beginOffset}s"
                    keyPoints="${finalKeyPoints}"
                    keyTimes="0;1" calcMode="linear">
                    <mpath href="${mpathHref}"/>
                </animateMotion>
            </circle>
        `;
		})}`,
	);
};
