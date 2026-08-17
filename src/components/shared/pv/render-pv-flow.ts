import { svg } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { Utils } from '../../../helpers/utils';
import {
	adjustDurationForPathLength,
	getPathLength,
} from '../../../helpers/path-length-cache';

const DOT_SPACING = 15;
const MAX_DOTS = 8;

export function renderPVFlow(
	id: string,
	path: string,
	color: string,
	lineWidth: number,
	powerWatts: number,
	duration: number,
	invertFlow: boolean,
	minLineWidth: number,
	className: string = '',
	keyPoints: string = '0;1',
) {
	const lineId = `${id}-line`;
	const finalKeyPoints =
		invertFlow === true ? Utils.invertKeyPoints(keyPoints) : keyPoints;
	// Show animation dot whenever power is strictly positive (avoid rounding to 0)
	const showDot = powerWatts > 0;
	// Ensure a valid positive duration; default to 1s if unset/invalid
	const durRaw = Number.isFinite(duration) && duration > 0 ? duration : 1;
	// Điều chỉnh theo độ dài thực tế của đường (giống renderCircle chung) —
	// giữ tốc độ px/giây nhất quán giữa các đường PV dài/ngắn khác nhau.
	const dur = adjustDurationForPathLength(durRaw, lineId);

	// Số chấm cách đều = độ dài thực tế / khoảng cách mong muốn (giống
	// helpers/render-circle.ts) — đường dài có nhiều chấm hơn đường ngắn.
	const pathLen = getPathLength(`#${lineId}`);
	const dotCount = pathLen
		? Math.min(MAX_DOTS, Math.max(1, Math.round(pathLen / DOT_SPACING)))
		: 1;
	const dotRadius =
		Math.min(2 + lineWidth + Math.max(minLineWidth - 2, 0), 8) * (2 / 3);
	// Làm tròn dur về 2 chữ số thập phân để làm "key" — ép Lit tạo lại
	// hoàn toàn nhóm chấm mỗi khi tốc độ đổi đáng kể (W tăng/giảm nhanh),
	// tránh timeline SMIL của animateMotion bị lệch dần do chỉ vá thuộc
	// tính "dur"/"begin" tại chỗ.
	const durationKey = Math.round(dur * 100) / 100;

	return svg`
		<svg
			id="${id}-flow"
			xmlns:xlink="http://www.w3.org/1999/xlink"
			overflow="visible"
		>
			<path
				id="${lineId}"
				d="${path}"
				fill="none"
				stroke="${color}"
				stroke-width="${lineWidth}"
				stroke-miterlimit="10"
				pointer-events="stroke"
				class="${className}"
			/>
			${
				showDot
					? keyed(
							durationKey,
							svg`${Array.from({ length: dotCount }, (_, i) => {
								const beginOffset = -((dur * i) / dotCount);
								return svg`<circle
						id="${id}-dot-${i}"
						r="${dotRadius}"
						fill="${color}"
						class="${className}"
					>
						<animateMotion
							dur="${dur}s"
							repeatCount="indefinite"
							begin="${beginOffset}s"
							keyPoints="${finalKeyPoints}"
							keyTimes="0;1"
							calcMode="linear"
							rotate="auto"
						>
							<mpath href="#${lineId}" xlink:href="#${lineId}" />
						</animateMotion>
					</circle>`;
							})}`,
						)
					: svg``
			}
		</svg>
	`;
}
