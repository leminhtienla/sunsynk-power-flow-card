// aux-elements.ts
import { svg, html } from 'lit';
import { guard } from 'lit/directives/guard.js';
import { repeat } from 'lit/directives/repeat.js';
import { localize } from '../../../localize/localize';
import { Utils } from '../../../helpers/utils';
import { DataDto, sunsynkPowerFlowCardConfig } from '../../../types';
import { icons } from '../../../helpers/icons';
import { UnitOfPower } from '../../../const';
import { createTextWithPopup, renderText } from '../../../helpers/text-utils';
import { getAuxIconConfigs } from './icon-configs';
import { renderStaticAuxIcon } from './render-static-aux-icons';
import { renderIcon } from '../../../helpers/render-icon';
import { renderPath } from '../../../helpers/render-path';
import { renderCircle } from '../../../helpers/render-circle';

export const renderAuxLoadElements = (
	data: DataDto,
	config: sunsynkPowerFlowCardConfig,
) => {
	const {
		showAux,
		additionalAuxLoad,
		largeFont,
		auxDynamicColour,
		auxStatus,
		auxPower,
		decimalPlaces,
		batteryColour,
		solarColour,
	} = data;

	const { auto_scale } = config.load;

	// "EPS LOAD" (config.load.aux_name) là label cạnh icon nhà EPS -- dùng
	// data.epsFlowColour (tính tập trung ở index.ts) để đồng bộ tuyệt đối với
	// khung EPS (V/Hz) và icon nhà EPS bên dưới, thay cho công thức cũ dựa
	// theo trạng thái switch (auxStatus on/off) vốn không đồng bộ.
	const { epsFlowColour } = data;

	return html`
		<!-- Aux Load Elements -->
		<svg
			id="Aux Load"
			style="overflow: visible; display: ${!showAux ? 'none' : 'inline'};"
			x="${config.wide ? '30%' : '3%'}"
			y="2.5%"
		>
			<rect
				x="${[1, 2].includes(config.solar?.mppts) ? '262' : '277'}"
				y="32"
				width="70"
				height="30"
				rx="4.5"
				ry="4.5"
				fill="none"
				stroke="${data.epsFlowColour}"
				pointer-events="all"
				class="${!showAux ? 'st12' : ''}"
			/>
			<rect
				id="aux-load1"
				x="374"
				y="20"
				width="70"
				height="25"
				rx="4.5"
				ry="4.5"
				fill="none"
				stroke="${data.auxDynamicColourLoad1}"
				pointer-events="all"
				display="${showAux ? '' : 'none'}"
				class="${[1, 2].includes(additionalAuxLoad) ? '' : 'st12'}"
			/>
			<rect
				id="aux-load2"
				x="374"
				y="50"
				width="70"
				height="25"
				rx="4.5"
				ry="4.5"
				fill="none"
				stroke="${data.auxDynamicColourLoad2}"
				pointer-events="all"
				display="${!showAux ? 'none' : ''}"
				class="${additionalAuxLoad === 2 ? '' : 'st12'}"
			/>
			${renderText(
				'daily_load_aux',
				[1, 2].includes(config.solar?.mppts) ? 263 : 278,
				93,
				!data.loadShowDaily || !showAux,
				'st3 left-align',
				data.stateDayLoadEnergy.toNum() > 0 ? data.loadColour : 'grey',
				config.load.label_daily_load || localize('common.daily_load'),
				true,
			)}
			${renderText(
				'aux_one',
				411,
				82,
				!showAux || [1, 2].includes(additionalAuxLoad),
				'st3 st8',
				epsFlowColour,
				config.load.aux_name || localize('common.aux_name'),
				true,
			)}
			${renderText(
				'aux_load1',
				411,
				additionalAuxLoad === 1 ? 53 : 14,
				!showAux || additionalAuxLoad === 0,
				'st3 st8',
				data.auxDynamicColourLoad1,
				config.load.aux_load1_name,
				true,
			)}
			${renderText(
				'aux_load2',
				411,
				83,
				!showAux || [0, 1].includes(additionalAuxLoad),
				'st3 st8',
				data.auxDynamicColourLoad2,
				config.load.aux_load2_name,
				true,
			)}
			${renderText(
				'aux_daily_text',
				[1, 2].includes(config.solar?.mppts) ? 263 : 278,
				24,
				!showAux || data.showDailyAux !== true,
				'st3 left-align',
				// Grey khi kWh cả ngày = 0, else auxBaseColour TĨNH (không phụ
				// thuộc công suất EPS tức thời như auxDynamicColour).
				data.stateDayAuxEnergy.toNum() > 0 ? data.auxBaseColour : 'grey',
				config.load.aux_daily_name || localize('common.daily_aux'),
				true,
			)}
			<svg id="aux-flow">
				${renderPath(
					'aux-line',
					[1, 2].includes(config.solar?.mppts)
						? 'M 332 47 L 371 47'
						: 'M 347 47 L 371 47',
					showAux,
					data.epsFlowColour,
					data.auxLineWidth,
				)}
				${renderCircle(
					'aux-dot',
					Math.min(
						2 + data.auxLineWidth + Math.max(data.minLineWidth - 2, 0),
						8,
					),
					auxPower <= 0 ? 'transparent' : data.epsFlowColour,
					data.durationCur['aux'],
					'0;1',
					'#aux-line',
					false,
					data.epsCycleColours,
				)}
				${renderCircle(
					'aux-dot',
					Math.min(
						2 + data.auxLineWidth + Math.max(data.minLineWidth - 2, 0),
						8,
					),
					auxPower >= 0 ? 'transparent' : data.epsFlowColour,
					data.durationCur['aux'],
					'1;0',
					'#aux-line',
					false,
					data.epsCycleColours,
				)}
			</svg>
			<svg id="aux1-flow">
				${
					config.entities?.eps_voltage
						? svg`
                    ${renderPath(
											'aux-line2-lower',
											// mppts 4/5/6: bắt nguồn từ điểm nối Inverter↔Grid-tie (đi cùng
											// phía với grid2-line), bo cong lên đáy khung EPS — tránh đè
											// lên cột PV thứ 2 khi bật 4 tấm trở lên.
											// mppts 1/2/3: đường thẳng đứng đơn giản như thiết kế ban đầu.
											[3, 4].includes(config.solar?.mppts)
												? 'M 215 187 Q 223.5 187 223.5 177 L 223.5 140'
												: 'M 180.15 162 L 180.15 140',
											showAux,
											data.epsFlowColour,
											data.auxLineWidth,
										)}
                    ${renderPath(
											'aux-line2-upper',
											// Đoạn trên: từ đỉnh khung V/Hz EPS lên và rẽ phải vào ô "0 W".
											[3, 4].includes(config.solar?.mppts)
												? 'M 223.5 95 L 223.5 57 Q 223.5 47 233.5 47 L 277 47'
												: 'M 180.15 95 L 180.15 57 Q 180.15 47 190.15 47 L 262 47',
											showAux,
											data.epsFlowColour,
											data.auxLineWidth,
										)}
                    ${renderCircle(
											'aux-dot-lower',
											Math.min(
												2 +
													data.auxLineWidth +
													Math.max(data.minLineWidth - 2, 0),
												8,
											),
											auxPower <= 0 ? 'transparent' : data.epsFlowColour,
											data.durationCur['aux'],
											'0;1',
											'#aux-line2-lower',
											false,
											data.epsCycleColours,
										)}
                    ${renderCircle(
											'aux-dot-lower',
											Math.min(
												2 +
													data.auxLineWidth +
													Math.max(data.minLineWidth - 2, 0),
												8,
											),
											auxPower >= 0 ? 'transparent' : data.epsFlowColour,
											data.durationCur['aux'],
											'1;0',
											'#aux-line2-lower',
											false,
											data.epsCycleColours,
										)}
                    ${renderCircle(
											'aux-dot-upper',
											Math.min(
												2 +
													data.auxLineWidth +
													Math.max(data.minLineWidth - 2, 0),
												8,
											),
											auxPower <= 0 ? 'transparent' : data.epsFlowColour,
											data.durationCur['aux'],
											'0;1',
											'#aux-line2-upper',
											false,
											data.epsCycleColours,
										)}
                    ${renderCircle(
											'aux-dot-upper',
											Math.min(
												2 +
													data.auxLineWidth +
													Math.max(data.minLineWidth - 2, 0),
												8,
											),
											auxPower >= 0 ? 'transparent' : data.epsFlowColour,
											data.durationCur['aux'],
											'1;0',
											'#aux-line2-upper',
											false,
											data.epsCycleColours,
										)}
                `
						: svg`
                    ${renderPath(
											'aux-line2',
											config.wide
												? 'M 108 162 L 108 57 Q 108 47 118 47 L 277 47'
												: 'M 180 162 L 180 57 Q 180 47 190 47 L 277 47',
											showAux,
											data.epsFlowColour,
											data.auxLineWidth,
										)}
                    ${renderCircle(
											'aux-dot',
											Math.min(
												2 +
													data.auxLineWidth +
													Math.max(data.minLineWidth - 2, 0),
												8,
											),
											auxPower <= 0 ? 'transparent' : data.epsFlowColour,
											data.durationCur['aux'],
											'0;1',
											'#aux-line2',
											false,
											data.epsCycleColours,
										)}
                    ${renderCircle(
											'aux-dot',
											Math.min(
												2 +
													data.auxLineWidth +
													Math.max(data.minLineWidth - 2, 0),
												8,
											),
											auxPower >= 0 ? 'transparent' : data.epsFlowColour,
											data.durationCur['aux'],
											'1;0',
											'#aux-line2',
											false,
											data.epsCycleColours,
										)}
                `
				}
			</svg>
			<!-- Aux Icon -->
			<a
				href="#"
				@click=${(e) =>
					Utils.handlePopup(e, config.entities.aux_connected_status)}
			>
				<g display="${config.load.dynamic_icon ? 'none' : ''}">
					${guard(
						[
							data.additionalAuxLoad,
							data.showAux,
							data.auxType,
							data.iconAuxLoad1,
							data.iconAuxLoad2,
							data.auxDynamicColour,
							data.auxDynamicColourLoad1,
							data.auxDynamicColourLoad2,
							data.auxOffColour,
							data.auxStatus,
						],
						() =>
							repeat(
								getAuxIconConfigs(data),
								(iconConfig) => iconConfig.id,
								(iconConfig) => renderStaticAuxIcon(iconConfig),
							),
					)}
				</g>
				<defs>
					<linearGradient id="epsLg" x1="0%" x2="0%" y1="100%" y2="0%">
						<stop offset="0%" stop-color="${batteryColour}" />
						<stop
							offset="${data.batteryPercentageEps < 2 ? 0 : data.batteryPercentageEps}%"
							stop-color="${batteryColour}"
						/>
						<stop
							offset="${data.batteryPercentageEps < 2 ? 0 : data.batteryPercentageEps}%"
							stop-color="${solarColour}"
						/>
						<stop offset="100%" stop-color="${solarColour}" />
					</linearGradient>
				</defs>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					id="aux_inverter"
					x="388"
					y="8"
					width="44"
					height="69"
					viewBox="0 0 74 91"
					preserveAspectRatio="xMidYMid meet"
				>
					<g
						transform="translate(0.000000,91.000000) scale(0.100000,-0.100000)"
						class="${!config.load.dynamic_icon && data.auxType === 'inverter' ? '' : 'st12'}"
						display="${
							!showAux || [1, 2].includes(additionalAuxLoad) ? 'none' : ''
						}"
						fill="${epsFlowColour}"
						stroke="none"
					>
						<path d="${icons.inverter}" />
					</g>
				</svg>
				<g
					display="${
						!showAux ||
						[1, 2].includes(additionalAuxLoad) ||
						config.load.dynamic_icon
							? 'none'
							: ''
					}"
				>
					${renderIcon(undefined, data.auxType, 'eps-icon', 375, 8, 70, 70)}
				</g>
				<g
					display="${
						!showAux ||
						[1, 2].includes(additionalAuxLoad) ||
						!config.load.dynamic_icon
							? 'none'
							: ''
					}"
					transform="translate(375, 8) scale(2.9166666)"
				>
					<path d="${data.epsIcon}" fill="${epsFlowColour}" />
				</g>
			</a>
			<g display="${!showAux || additionalAuxLoad === 0 ? 'none' : ''}">
				${renderIcon(
					undefined,
					data.iconAuxLoad1,
					'aux-small-icon-1',
					345,
					18,
					40,
					40,
				)}
			</g>
			<g
				display="${
					!showAux || [0, 1].includes(additionalAuxLoad) ? 'none' : ''
				}"
			>
				${renderIcon(
					undefined,
					data.iconAuxLoad2,
					'aux-small-icon-2',
					345,
					52,
					40,
					40,
				)}
			</g>
			${createTextWithPopup(
				'aux_daily_value',
				[1, 2].includes(config.solar?.mppts) ? 263 : 278,
				12,
				!showAux ||
					data.showDailyAux !== true ||
					!data.stateDayAuxEnergy.isValid(),
				'st10 left-align',
				data.stateDayAuxEnergy.toNum() > 0 ? data.auxBaseColour : 'grey',
				data.stateDayAuxEnergy.toPowerString(true, data.decimalPlacesEnergy),
				(e) => Utils.handlePopup(e, config.entities.day_aux_energy),
				true,
			)}
			${
				config.entities?.aux_power_166
					? svg`
                    ${createTextWithPopup(
											'aux_power_166',
											[1, 2].includes(config.solar?.mppts) ? 295 : 310,
											48,
											!showAux,
											`${largeFont !== true ? 'st14' : 'st4'} st8`,
											data.epsFlowColour,
											auto_scale
												? `${
														config.load.show_absolute_aux
															? `${Math.abs(parseFloat(Utils.convertValue(auxPower, decimalPlaces)))} ${Utils.convertValue(auxPower, decimalPlaces).split(' ')[1]}`
															: Utils.convertValue(auxPower, decimalPlaces) ||
																'0'
													}`
												: `${
														config.load.show_absolute_aux
															? `${Math.abs(auxPower)}`
															: auxPower || 0
													} ${UnitOfPower.WATT}`,
											(e) =>
												Utils.handlePopup(e, config.entities.aux_power_166),
											true,
										)}`
					: svg`
                    ${renderText(
											'aux_power_166',
											[1, 2].includes(config.solar?.mppts) ? 295 : 310,
											48,
											!showAux,
											`${largeFont !== true ? 'st14' : 'st4'} st8`,
											data.epsFlowColour,
											auto_scale
												? `${
														config.load.show_absolute_aux
															? `${Math.abs(parseFloat(Utils.convertValue(auxPower, decimalPlaces)))} ${Utils.convertValue(auxPower, decimalPlaces).split(' ')[1]}`
															: Utils.convertValue(auxPower, decimalPlaces) ||
																'0'
													}`
												: `${
														config.load.show_absolute_aux
															? `${Math.abs(auxPower)}`
															: auxPower || 0
													} ${UnitOfPower.WATT}`,
											true,
										)}`
			}
			${createTextWithPopup(
				'aux_load1_value',
				411,
				34,
				!showAux || additionalAuxLoad === 0 || !data.stateAuxLoad1.isValid(),
				`${largeFont !== true ? 'st14' : 'st4'} st8`,
				data.auxDynamicColourLoad1,
				data.stateAuxLoad1.toPowerString(auto_scale, decimalPlaces),
				(e) => Utils.handlePopup(e, config.entities.aux_load1),
				true,
			)}
			${createTextWithPopup(
				'aux_load2_value',
				411,
				64,
				!showAux ||
					[0, 1].includes(additionalAuxLoad) ||
					!data.stateAuxLoad2.isValid(),
				`${largeFont !== true ? 'st14' : 'st4'} st8`,
				data.auxDynamicColourLoad2,
				data.stateAuxLoad2.toPowerString(auto_scale, decimalPlaces),
				(e) => Utils.handlePopup(e, config.entities.aux_load2),
				true,
			)}
			${createTextWithPopup(
				'aux_load1_extra',
				411,
				8,
				!showAux ||
					[1, 2].includes(additionalAuxLoad) ||
					!config.entities.aux_load1_extra,
				'st3 st8',
				auxStatus === 'on' || auxStatus === '1'
					? auxDynamicColour
					: data.auxOffColour,
				`${Utils.formatNumberLocale(
					data.stateAuxLoad1Extra.toNum(1),
					1,
				)} ${data.stateAuxLoad1Extra?.getUOM()}`,
				(e) => Utils.handlePopup(e, config.entities.aux_load1_extra),
				true,
			)}
			${createTextWithPopup(
				'aux_load1_extra',
				360,
				14,
				showAux &&
					[1, 2].includes(additionalAuxLoad) &&
					config.entities.aux_load1_extra,
				'st3 st8',
				data.auxDynamicColourLoad1,
				`${Utils.formatNumberLocale(
					data.stateAuxLoad1Extra.toNum(1),
					1,
				)} ${data.stateAuxLoad1Extra?.getUOM()}`,
				(e) => Utils.handlePopup(e, config.entities.aux_load1_extra),
			)}
			${createTextWithPopup(
				'aux_load2_extra',
				360,
				83,
				!showAux ||
					[0, 1].includes(additionalAuxLoad) ||
					!config.entities.aux_load2_extra,
				'st3 st8',
				data.auxDynamicColourLoad2,
				`${Utils.formatNumberLocale(
					data.stateAuxLoad2Extra.toNum(1),
					1,
				)} ${data.stateAuxLoad2Extra?.getUOM()}`,
				(e) => Utils.handlePopup(e, config.entities.aux_load2_extra),
				true,
			)}
		</svg>
	`;
};
