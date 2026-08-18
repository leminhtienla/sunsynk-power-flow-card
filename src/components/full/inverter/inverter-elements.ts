// inverter-elements.ts
import { svg, html } from 'lit';
import { guard } from 'lit/directives/guard.js';
import { localize } from '../../../localize/localize';
import { Utils } from '../../../helpers/utils';
import {
	AutarkyType,
	DataDto,
	sunsynkPowerFlowCardConfig,
} from '../../../types';
import { icons } from '../../../helpers/icons';
import { UnitOfElectricalCurrent, UnitOfPower } from '../../../const';
import { createTextWithPopup, renderText } from '../../../helpers/text-utils';
import { renderPath } from '../../../helpers/render-path';
import { renderCircle } from '../../../helpers/render-circle';

export const renderInverterElements = (
	data: DataDto,
	inverterImg: string,
	config: sunsynkPowerFlowCardConfig,
) => {
	const {
		inverterColour,
		largeFont,
		enableAutarky,
		enableTimer,
		priorityLoad,
	} = data;

	const { auto_scale, three_phase } = config.inverter;

	// Màu dùng chung cho "nhóm Inverter output": khung Inverter (W/A), khung
	// EPS (V/Hz), khung Grid-tie (V/Hz) và toàn bộ text số bên trong 3 khung
	// này -- vì cả 3 chỉ là readout của cùng 1 nguồn (công suất Inverter xuất
	// ra), không phải công suất lưới thực hay aux load riêng. Đồng bộ với
	// công thức của 'inverter-path'/'grid2-line' (inverter-elements.ts,
	// grid-elements.ts) để không lệch nhóm.
	// ĐƠN GIẢN HÓA (sửa lớn): khung Inverter/EPS KHÔNG còn pha trộn màu động
	// nữa -- chỉ dùng inverterColour RIÊNG (giống các nhóm khác), grey khi
	// Standby. Màu pha trộn động (flowInvColour/epsSourceColour) giờ CHỈ
	// dùng cho DOT animation.
	const inverterGroupColour = data.isInverterStandby ? 'grey' : inverterColour;

	// Khung EPS (V/Hz): dùng data.epsFlowColour (tính tập trung ở index.ts,
	// dùng chung với label "EPS LOAD" và icon nhà EPS ở aux-elements.ts) để
	// đồng bộ tuyệt đối trong toàn bộ nhóm EPS.
	const { epsFlowColour } = data;

	// Khung Inverter (W/A): inverterColour riêng, grey riêng khi công suất
	// Inverter hiện tại (displayInverterPower) = 0. Dùng ngưỡng nhỏ (<1W)
	// thay vì so sánh chặt !==0 -- sensor có thể trả về sai số thập phân
	// cực nhỏ thay vì đúng số 0 tuyệt đối.
	const inverterFlowColour =
		Math.abs(Utils.toNum(data.displayInverterPower, 0)) >= 1
			? inverterColour
			: 'grey';

	// Status text (inverter_status_text): biên phải x=401 (rút thêm 15px so
	// với x=416 trước đây), tối đa ~42 ký tự/dòng (đo THẬT bằng fonttools
	// trên font Roboto Regular 9px, ~4.4px/ký tự có biên an toàn). Nếu dài
	// hơn 1 dòng thì XUỐNG DÒNG (word-wrap tại khoảng trắng gần nhất) thay
	// vì chỉ cắt "..." như trước.
	const STATUS_TEXT_MAX_CHARS_PER_LINE = 42;
	let statusTextLine1 = '';
	let statusTextLine2 = '';
	if (data.inverterStatusText) {
		const full = data.inverterStatusText;
		if (full.length <= STATUS_TEXT_MAX_CHARS_PER_LINE) {
			statusTextLine1 = full;
		} else {
			// Tìm khoảng trắng gần nhất trước giới hạn để bẻ dòng theo từ,
			// tránh cắt giữa từ.
			let breakAt = full.lastIndexOf(' ', STATUS_TEXT_MAX_CHARS_PER_LINE);
			if (breakAt <= 0) breakAt = STATUS_TEXT_MAX_CHARS_PER_LINE;
			statusTextLine1 = full.slice(0, breakAt).trim();
			const rest = full.slice(breakAt).trim();
			statusTextLine2 =
				rest.length > STATUS_TEXT_MAX_CHARS_PER_LINE
					? `${rest.slice(0, STATUS_TEXT_MAX_CHARS_PER_LINE - 3)}...`
					: rest;
		}
	}

	return html`
		<!-- Inverter Elements -->
		<svg
			id="Inverter"
			style="overflow: visible"
			x="${config.wide ? '20%' : '3%'}"
			y="2.5%"
		>
			<rect
				x="145.15"
				y="162"
				width="70"
				height="${three_phase ? 60 : 50}"
				rx="7.5"
				ry="7.5"
				fill="none"
				stroke="${inverterFlowColour}"
				pointer-events="all"
			/>
			<text x="167" y="306" class="st3 left-align" fill="${inverterColour}">
				${data.inverterStateMsg}
			</text>
			${renderText(
				'autarkye_value',
				212,
				283,
				enableAutarky === AutarkyType.No,
				enableAutarky === AutarkyType.Energy ? 'st4 st8 left-align' : 'st12',
				inverterColour,
				`${data.autarkyEnergy}%`,
				true,
			)}
			${renderText(
				'ratioe_value',
				256,
				283,
				enableAutarky === AutarkyType.No,
				enableAutarky === AutarkyType.Energy ? 'st4 st8 left-align' : 'st12',
				inverterColour,
				`${data.ratioEnergy}%`,
				true,
			)}
			${renderText(
				'autarkyp_value',
				212,
				283,
				enableAutarky === AutarkyType.No,
				enableAutarky === AutarkyType.Power ? 'st4 st8 left-align' : 'st12',
				inverterColour,
				`${data.autarkyPower}%`,
				true,
			)}
			${renderText(
				'ratiop_value',
				256,
				283,
				enableAutarky === AutarkyType.No,
				enableAutarky === AutarkyType.Power ? 'st4 st8 left-align' : 'st12',
				inverterColour,
				`${data.ratioPower}%`,
				true,
			)}
			${renderText(
				'autarky',
				212,
				295,
				enableAutarky === AutarkyType.No,
				'st3 left-align',
				inverterColour,
				config.inverter.label_autarky || localize('common.autarky'),
				true,
			)}
			${renderText(
				'ratio',
				256,
				295,
				enableAutarky === AutarkyType.No,
				'st3 left-align',
				inverterColour,
				config.inverter.label_ratio || localize('common.ratio'),
				true,
			)}
			<circle
				id="standby"
				cx="160"
				cy="304"
				r="3.5"
				fill="${data.inverterStateColour}"
			/>
			${renderPath(
				'inverter-path',
				three_phase ? 'M 180 223 L 180 235' : 'M 180 212 L 180 235',
				true,
				inverterGroupColour,
				data.inverterStubLineWidth,
			)}
			${renderCircle(
				'inverter-dot',
				Math.min(
					2 + data.inverterStubLineWidth + Math.max(data.minLineWidth - 2, 0),
					8,
				),
				data.isInverterStandby || data.displayInverterPower <= 0
					? 'transparent'
					: inverterGroupColour,
				data.durationCur['inverter'],
				// Path 'inverter-path' đầu = trên (223/212), cuối = dưới (235, vào khung Inverter).
				// Công suất dương: PV/Pin đẩy ra khỏi Inverter (lên EPS hoặc bám lưới) → đi từ dưới lên trên.
				'1;0',
				'#inverter-path',
				false,
				data.inverterCycleColours,
			)}
			${renderCircle(
				'inverter-dot',
				Math.min(
					2 + data.inverterStubLineWidth + Math.max(data.minLineWidth - 2, 0),
					8,
				),
				data.isInverterStandby || data.displayInverterPower >= 0
					? 'transparent'
					: inverterGroupColour,
				data.durationCur['inverter'],
				'0;1',
				'#inverter-path',
				false,
				data.inverterCycleColours,
			)}
			${guard(
				[
					inverterColour,
					data.genericInverterImage,
					Boolean(config.inverter?.navigate),
				],
				() =>
					config.inverter?.navigate
						? svg`
							<a href="#" @click=${(e) => Utils.handleNavigation(e, config.inverter.navigate)}>
								<svg xmlns="http://www.w3.org/2000/svg" x="154.5" y="224.75" width="54"
									height="79" viewBox="0 0 74 91" preserveAspectRatio="xMidYMid meet"
									opacity="${!data.genericInverterImage ? 0 : 1}">
									<g transform="translate(0.000000,91.000000) scale(0.100000,-0.100000)"
									fill="${inverterColour}" stroke="none">
										<path d="${icons.inverter}"/>
									</g>
								</svg>
							</a>`
						: svg`
							<svg xmlns="http://www.w3.org/2000/svg" x="154.5" y="224.75" width="54"
								height="79" viewBox="0 0 74 91" preserveAspectRatio="xMidYMid meet"
								opacity="${!data.genericInverterImage ? 0 : 1}">
								<g transform="translate(0.000000,91.000000) scale(0.100000,-0.100000)"
								fill="${inverterColour}" stroke="none">
									<path d="${icons.inverter}"/>
								</g>
							</svg>`,
			)}
			<a
				href="#"
				@click=${(e) => Utils.handlePopup(e, config.entities.use_timer_248)}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					id="timer"
					x="210"
					y="${enableAutarky != AutarkyType.No ? '232' : '249'}"
					width="18"
					height="18"
					viewBox="0 0 24 24"
				>
					<path
						display="${data.stateUseTimer.state == 'on' && enableTimer !== 'no'
							? ''
							: 'none'}"
						fill="${inverterColour}"
						d="${icons.timerOn}"
					/>
				</svg>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					id="timer_off"
					x="210"
					y="${enableAutarky != AutarkyType.No ? '232' : '249'}"
					width="18"
					height="18"
					viewBox="0 0 24 24"
				>
					<path
						display="${data.stateUseTimer.state == 'off' && enableTimer !== 'no'
							? ''
							: 'none'}"
						fill="${inverterColour}"
						d="${icons.timerOff}"
					/>
				</svg>
				${renderText(
					'timer_text_on',
					228.5,
					enableAutarky != AutarkyType.No ? 243 : 260,
					data.stateUseTimer.state == 'on' && enableTimer !== 'no',
					'st3 left-align',
					inverterColour,
					localize('common.timer_on'),
				)}
				${renderText(
					'timer_text_off',
					228.5,
					enableAutarky != AutarkyType.No ? 243 : 260,
					data.stateUseTimer.state == 'off' && enableTimer !== 'no',
					'st3 left-align',
					inverterColour,
					localize('common.timer_off'),
				)}
			</a>
			<a
				href="#"
				@click=${(e) => Utils.handlePopup(e, config.entities.priority_load_243)}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					id="pbat"
					x="210"
					y="${enableAutarky != 'no' ? '251' : '268'}"
					width="18"
					height="18"
					viewBox="0 0 24 24"
				>
					<path
						display="${priorityLoad === 'off' &&
						(priorityLoad !== 'no' || !priorityLoad)
							? ''
							: 'none'}"
						fill="${inverterColour}"
						d="${icons.priorityLoadOff}"
					/>
				</svg>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					id="pload"
					x="210"
					y="${enableAutarky != 'no' ? '251' : '268'}"
					width="18"
					height="18"
					viewBox="0 0 24 24"
				>
					<path
						display="${priorityLoad === 'on' &&
						(priorityLoad !== 'no' || !priorityLoad)
							? ''
							: 'none'}"
						fill="${inverterColour}"
						d="${icons.priorityLoadOn}"
					/>
				</svg>
				${renderText(
					'priority_text_load',
					228.5,
					enableAutarky != AutarkyType.No ? 262 : 280,
					priorityLoad === 'on' && (priorityLoad !== 'no' || !priorityLoad),
					'st3 left-align',
					inverterColour,
					localize('common.priority_load'),
				)}
				${renderText(
					'priority_text_batt',
					228.5,
					enableAutarky != AutarkyType.No ? 262 : 280,
					priorityLoad === 'off' && (priorityLoad !== 'no' || !priorityLoad),
					'st3 left-align',
					inverterColour,
					localize('common.priority_batt'),
				)}
			</a>
			${config.inverter?.navigate
				? svg`
                    <a href="#" @click=${(e) => Utils.handleNavigation(e, config.inverter.navigate)}>
                        <image x="155" y="224.75" width="53" height="72"
                            class="${!data.genericInverterImage ? '' : 'st12'}"
                            href="${inverterImg}"
                            preserveAspectRatio="none"/>
                    </a>`
				: svg`
                    <image x="155" y="224.75" width="53" height="72"
                        class="${!data.genericInverterImage ? '' : 'st12'}"
                        href="${inverterImg}"
                        preserveAspectRatio="none"/>`}
			<a
				href="#"
				@click=${(e) => Utils.handlePopup(e, data.inverterProg.entityID)}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					id="prog_grid_on"
					x="265"
					y="${enableAutarky != AutarkyType.No ? '232' : '249'}"
					width="20"
					height="18"
					viewBox="0 0 24 24"
				>
					<path
						display="${data.inverterProg.show === false || enableTimer === 'no'
							? 'none'
							: ''}"
						class="${data.inverterProg.charge === 'none' ||
						(data.stateUseTimer.state != 'off' &&
							data.stateUseTimer.state != 'on')
							? 'st12'
							: ''}"
						fill="${inverterColour}"
						d="${icons.progGridOn}"
					/>
				</svg>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					id="prog_grid_off"
					x="265"
					y="${enableAutarky != AutarkyType.No ? '232' : '249'}"
					width="20"
					height="18"
					viewBox="0 0 24 24"
				>
					<path
						display="${data.inverterProg.show === false || enableTimer === 'no'
							? 'none'
							: ''}"
						class="${data.inverterProg.charge === 'none' &&
						(data.stateUseTimer.state === 'off' ||
							data.stateUseTimer.state === 'on')
							? ''
							: 'st12'}"
						fill="${inverterColour}"
						d="${icons.progGridOff}"
					/>
				</svg>
			</a>
			${createTextWithPopup(
				'inverter_current_164',
				180.5,
				three_phase ? 188 : 199,
				config.entities.inverter_current_164 === 'none' ||
					!config.entities.inverter_current_164,
				`${largeFont !== true ? 'st14' : 'st4'} st8`,
				inverterFlowColour,
				`${Utils.formatNumberLocale(
					data.inverterCurrent,
					1,
				)} ${UnitOfElectricalCurrent.AMPERE}`,
				(e) => Utils.handlePopup(e, config.entities.inverter_current_164),
				true,
			)}
			${createTextWithPopup(
				'inverter_current_L2',
				180.5,
				201,
				!!(three_phase && config.entities?.inverter_current_L2),
				`${largeFont !== true ? 'st14' : 'st4'} st8`,
				inverterFlowColour,
				`${Utils.formatNumberLocale(
					data.inverterCurrentL2,
					1,
				)} ${UnitOfElectricalCurrent.AMPERE}`,
				(e) => Utils.handlePopup(e, config.entities.inverter_current_L2),
			)}
			${createTextWithPopup(
				'inverter_current_L3',
				180.5,
				214,
				!!(three_phase && config.entities?.inverter_current_L3),
				`${largeFont !== true ? 'st14' : 'st4'} st8`,
				inverterFlowColour,
				`${Utils.formatNumberLocale(
					data.inverterCurrentL3,
					1,
				)} ${UnitOfElectricalCurrent.AMPERE}`,
				(e) => Utils.handlePopup(e, config.entities.inverter_current_L3),
			)}
			${createTextWithPopup(
				'inverter_power_175',
				180.5,
				three_phase ? 174 : 178,
				config.entities.inverter_power_175 === 'none',
				`${largeFont !== true ? 'st14' : 'st4'} st8`,
				inverterFlowColour,
				// Bám lưới: hiện công suất grid-tie (inverter_power_175).
				// Mất lưới, chạy EPS độc lập: hiện công suất EPS thực tế (eps_power).
				auto_scale
					? `${Utils.convertValue(data.displayInverterPower, data.decimalPlaces) || 0}`
					: `${data.displayInverterPower} ${UnitOfPower.WATT}`,
				(e) => Utils.handlePopup(e, config.entities.inverter_power_175),
				true,
			)}
			${createTextWithPopup(
				'ac_temp',
				!config.wide ? 110 : 134,
				!config.wide ? 237 : 153,
				!!(
					config.entities?.radiator_temp_91 && data.stateRadiatorTemp.isValid()
				),
				'st3 left-align',
				inverterColour,
				`AC: ${Utils.formatNumberLocale(data.stateRadiatorTemp.toNum(1), 1)}°`,
				(e) => Utils.handlePopup(e, config.entities.radiator_temp_91),
			)}
			${config.entities?.inverter_status_text
				? svg`
                    ${createTextWithPopup(
						'inverter_status_text',
						212,
						250,
						!!statusTextLine1,
						'st3 left-align',
						inverterColour,
						statusTextLine1,
						(e) =>
							Utils.handlePopup(e, config.entities.inverter_status_text),
					)}
                    ${
											statusTextLine2
												? createTextWithPopup(
														'inverter_status_text_line2',
														212,
														261,
														true,
														'st3 left-align',
														inverterColour,
														statusTextLine2,
														(e) =>
															Utils.handlePopup(
																e,
																config.entities.inverter_status_text,
															),
													)
												: ''
										}
                `
				: ''}
			${config.entities?.eps_voltage
				? svg`
                    <rect
						x="${[3, 4].includes(config.solar?.mppts) ? '188.5' : '145.15'}"
						y="95"
						width="70"
						height="45"
						rx="10.5"
						ry="10.5"
						fill="none"
						stroke="${epsFlowColour}"
						pointer-events="all"
					/>
                    ${createTextWithPopup(
						'eps_voltage',
						[3, 4].includes(config.solar?.mppts) ? 223.5 : 180.15,
						110,
						false,
						`${largeFont !== true ? 'st14' : 'st4'} st8`,
						epsFlowColour,
						`${Utils.formatNumberLocale(data.epsVoltage, 0)} V`,
						(e) => Utils.handlePopup(e, config.entities.eps_voltage),
						true,
					)}
                    ${config.entities?.eps_frequency
						? createTextWithPopup(
								'eps_frequency',
								[3, 4].includes(config.solar?.mppts) ? 223.5 : 180.15,
								130,
								false,
								`${largeFont !== true ? 'st14' : 'st4'} st8`,
								epsFlowColour,
								`${Utils.formatNumberLocale(data.epsFrequency, 1)} Hz`,
								(e) =>
									Utils.handlePopup(e, config.entities.eps_frequency),
								true,
							)
						: ''}
                    ${renderText(
						'eps_v_hz_label',
						[3, 4].includes(config.solar?.mppts) ? 243.5 : 200.15,
						148,
						false,
						'st3',
						epsFlowColour, // Label EPS trong khung V/Hz theo màu flow động (PV/Pin)
						'EPS',
						true,
					)}
                `
				: ''}
			${createTextWithPopup(
				'dc_temp',
				110,
				266,
				!!(
					config.entities?.dc_transformer_temp_90 &&
					data.stateDCTransformerTemp.isValid()
				),
				'st3 left-align',
				inverterColour,
				`DC: ${Utils.formatNumberLocale(data.stateDCTransformerTemp.toNum(1), 1)}°`,
				(e) => Utils.handlePopup(e, config.entities.dc_transformer_temp_90),
			)}
		</svg>
	`;
};
