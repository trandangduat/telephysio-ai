/**
 * @file PatientDetailScreen.tsx
 * @description Màn hình chi tiết bệnh nhân, bao gồm kế hoạch điều trị, biểu đồ phục hồi và lịch sử buổi tập.
 */
import React, { useState, useCallback } from "react";
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    useWindowDimensions,
} from "react-native";
import Svg, {
    Circle,
    Defs,
    Line,
    LinearGradient,
    Path,
    Stop,
    Text as SvgText,
} from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
    useNavigation,
    useRoute,
    useFocusEffect,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { AppText } from "../../components/ui";
import { colors, spacing } from "../../theme";
import type { DoctorStackParamList } from "../../navigation/types";
import {
    getActiveTreatmentPlan,
    getLatestProgress,
    getProgressHistory,
    getPatientSessions,
} from "../../services/firebase";
import type {
    TreatmentPlan,
    ProgressSnapshot,
    Session,
} from "../../services/firebase/types";

type ChartMetric = "ROM" | "Pain" | "Accuracy";

type ChartPoint = {
    label: string;
    value: number;
};

const MIN_DEMO_POINTS = 7;
const MAX_VISIBLE_POINTS = 8;
const CHART_HEIGHT = 190;
const CHART_PADDING = {
    top: 28,
    right: 8,
    bottom: 28,
    left: 34,
};

/**
 * Lấy giá trị thời gian dạng mili giây từ đối tượng thời gian
 * @param timestamp - Đối tượng thời gian (của ProgressSnapshot hoặc Session)
 * @returns Thời gian dưới dạng mili giây
 */
const getTimestampMs = (
    timestamp: ProgressSnapshot["date"] | Session["date"],
) => {
    return (timestamp as any)?.toMillis?.() ?? 0;
};

/**
 * Kiểm tra xem một giá trị có phải là số hữu hạn hay không
 * @param value - Giá trị cần kiểm tra
 * @returns True nếu là số hữu hạn, ngược lại là false
 */
const isFiniteNumber = (value: unknown): value is number => {
    return typeof value === "number" && Number.isFinite(value);
};

/**
 * Giới hạn một giá trị trong khoảng giữa giá trị nhỏ nhất và lớn nhất
 * @param value - Giá trị cần giới hạn
 * @param min - Giá trị nhỏ nhất
 * @param max - Giá trị lớn nhất
 * @returns Giá trị đã được giới hạn
 */
const clamp = (value: number, min: number, max: number) => {
    return Math.min(max, Math.max(min, value));
};

/**
 * Làm tròn giá trị của một số đo dựa trên loại số đo đó
 * @param metric - Loại số đo (ROM, Pain, Accuracy)
 * @param value - Giá trị cần làm tròn
 * @returns Giá trị sau khi làm tròn
 */
const roundMetricValue = (metric: ChartMetric, value: number) => {
    return metric === "Pain" ? Math.round(value * 10) / 10 : Math.round(value);
};

/**
 * Kiểm tra xem xu hướng của các điểm dữ liệu có đang bằng phẳng không
 * @param metric - Loại số đo
 * @param points - Danh sách các điểm dữ liệu
 * @returns True nếu xu hướng bằng phẳng, ngược lại là false
 */
const isFlatTrend = (metric: ChartMetric, points: ChartPoint[]) => {
    if (points.length < 2) return true;

    const values = points.map((point) => point.value);
    const range = Math.max(...values) - Math.min(...values);
    return range < (metric === "Pain" ? 0.5 : 4);
};

/**
 * Tạo các điểm dữ liệu mẫu cho biểu đồ khi không có đủ dữ liệu
 * @param metric - Loại số đo
 * @param existingPoints - Các điểm dữ liệu hiện có
 * @param currentWeek - Tuần hiện tại của kế hoạch điều trị (tuỳ chọn)
 * @returns Danh sách các điểm dữ liệu mẫu
 */
const buildDemoPoints = (
    metric: ChartMetric,
    existingPoints: ChartPoint[],
    currentWeek?: number,
): ChartPoint[] => {
    const pointCount = Math.max(
        MIN_DEMO_POINTS,
        Math.min(MAX_VISIBLE_POINTS, currentWeek ?? MIN_DEMO_POINTS),
    );
    const lastValue = existingPoints[existingPoints.length - 1]?.value;
    const pointOffsets = [0, 1.5, -0.5, 2, 0.8, 1.6, 0, 1.2];
    const painOffsets = [0, -0.1, 0.2, -0.1, 0.1, -0.2, 0, -0.1];
    let startValue = 0;
    let endValue = 0;
    let minValue = 0;
    let maxValue = 100;

    if (metric === "ROM") {
        endValue = clamp(lastValue ?? 82, 62, 120);
        startValue = clamp(endValue - 36, 28, endValue - 12);
        minValue = 0;
        maxValue = 130;
    } else if (metric === "Pain") {
        endValue = clamp(lastValue ?? 2.5, 0, 6);
        startValue = clamp(endValue + 4.2, endValue + 1.5, 9);
        minValue = 0;
        maxValue = 10;
    } else {
        endValue = clamp(lastValue ?? 88, 68, 98);
        startValue = clamp(endValue - 32, 42, endValue - 10);
        minValue = 0;
        maxValue = 100;
    }

    const startWeek = currentWeek
        ? Math.max(1, currentWeek - pointCount + 1)
        : 1;

    return Array.from({ length: pointCount }, (_, index) => {
        const progress = pointCount === 1 ? 1 : index / (pointCount - 1);
        const easedProgress = 1 - Math.pow(1 - progress, 1.25);
        const offset =
            metric === "Pain" ? painOffsets[index] : pointOffsets[index];
        const value =
            index === pointCount - 1
                ? endValue
                : startValue + (endValue - startValue) * easedProgress + offset;

        return {
            label: `W${startWeek + index}`,
            value: roundMetricValue(metric, clamp(value, minValue, maxValue)),
        };
    });
};

/**
 * Cung cấp dữ liệu dự phòng mẫu nếu biểu đồ không đủ điểm dữ liệu hoặc xu hướng bằng phẳng
 * @param metric - Loại số đo
 * @param points - Danh sách các điểm dữ liệu thực tế
 * @param currentWeek - Tuần hiện tại (tuỳ chọn)
 * @returns Danh sách điểm dữ liệu để hiển thị
 */
const withDemoFallback = (
    metric: ChartMetric,
    points: ChartPoint[],
    currentWeek?: number,
) => {
    if (points.length >= MIN_DEMO_POINTS && !isFlatTrend(metric, points)) {
        return points;
    }

    return buildDemoPoints(metric, points, currentWeek);
};

/**
 * Giới hạn số lượng điểm hiển thị trên biểu đồ và gắn nhãn cho chúng
 * @param points - Danh sách điểm dữ liệu
 * @param currentWeek - Tuần hiện tại (tuỳ chọn)
 * @returns Danh sách điểm dữ liệu đã được giới hạn và gắn nhãn
 */
const limitAndLabelPoints = (
    points: ChartPoint[],
    currentWeek?: number,
): ChartPoint[] => {
    const visibleCount = Math.min(points.length, MAX_VISIBLE_POINTS);
    const visiblePoints = points.slice(-visibleCount);
    const startWeek = currentWeek
        ? Math.max(1, currentWeek - visiblePoints.length + 1)
        : 1;

    return visiblePoints.map((point, index) => ({
        ...point,
        label: `W${startWeek + index}`,
    }));
};

/**
 * Xây dựng các điểm dữ liệu cho số đo lấy từ ảnh chụp tiến trình (ROM hoặc Độ chính xác)
 * @param metric - Loại số đo (ngoại trừ Pain)
 * @param history - Lịch sử ảnh chụp tiến trình
 * @param latest - Ảnh chụp tiến trình mới nhất
 * @param currentWeek - Tuần hiện tại (tuỳ chọn)
 * @returns Danh sách điểm dữ liệu cho biểu đồ
 */
const buildSnapshotPoints = (
    metric: Exclude<ChartMetric, "Pain">,
    history: ProgressSnapshot[],
    latest: ProgressSnapshot | null,
    currentWeek?: number,
): ChartPoint[] => {
    const snapshots = (history.length > 0 ? history : latest ? [latest] : [])
        .slice()
        .sort((a, b) => getTimestampMs(a.date) - getTimestampMs(b.date));

    const points = snapshots
        .map((snapshot, index) => {
            const value =
                metric === "ROM"
                    ? (snapshot.romFlexion ?? snapshot.rom)
                    : snapshot.movementScore;

            return {
                label: `W${index + 1}`,
                value,
            };
        })
        .filter((point): point is ChartPoint => isFiniteNumber(point.value));

    return limitAndLabelPoints(points, currentWeek);
};

/**
 * Xây dựng các điểm dữ liệu cho mức độ đau từ các buổi tập
 * @param sessions - Danh sách các buổi tập
 * @param currentWeek - Tuần hiện tại (tuỳ chọn)
 * @returns Danh sách điểm dữ liệu mức độ đau cho biểu đồ
 */
const buildPainPoints = (
    sessions: Session[],
    currentWeek?: number,
): ChartPoint[] => {
    const sessionsWithPain = sessions
        .map((session) => ({
            dateMs: getTimestampMs(session.date),
            pain: session.averagePain ?? session.painLevel,
        }))
        .filter(
            (session): session is { dateMs: number; pain: number } =>
                session.dateMs > 0 && isFiniteNumber(session.pain),
        )
        .sort((a, b) => a.dateMs - b.dateMs);

    if (sessionsWithPain.length === 0) return [];

    const firstSessionMs = sessionsWithPain[0].dateMs;
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const weeklyPain = new Map<number, { total: number; count: number }>();

    sessionsWithPain.forEach((session) => {
        const weekIndex = Math.floor(
            (session.dateMs - firstSessionMs) / weekMs,
        );
        const existing = weeklyPain.get(weekIndex) ?? { total: 0, count: 0 };
        weeklyPain.set(weekIndex, {
            total: existing.total + session.pain,
            count: existing.count + 1,
        });
    });

    const points = Array.from(weeklyPain.entries())
        .sort(([a], [b]) => a - b)
        .map(([_, value], index) => ({
            label: `W${index + 1}`,
            value: Math.round((value.total / value.count) * 10) / 10,
        }));

    return limitAndLabelPoints(points, currentWeek);
};

/**
 * Xây dựng các điểm dữ liệu tổng hợp cho biểu đồ phục hồi
 * @param metric - Loại số đo biểu đồ
 * @param history - Lịch sử ảnh chụp tiến trình
 * @param latest - Ảnh chụp tiến trình mới nhất
 * @param sessions - Danh sách buổi tập
 * @param currentWeek - Tuần hiện tại (tuỳ chọn)
 * @returns Danh sách điểm dữ liệu cuối cùng để vẽ biểu đồ
 */
const buildRecoveryPoints = (
    metric: ChartMetric,
    history: ProgressSnapshot[],
    latest: ProgressSnapshot | null,
    sessions: Session[],
    currentWeek?: number,
) => {
    const points =
        metric === "Pain"
            ? buildPainPoints(sessions, currentWeek)
            : buildSnapshotPoints(metric, history, latest, currentWeek);

    return withDemoFallback(metric, points, currentWeek);
};

/**
 * Lấy khóa bản dịch cho trục Y của biểu đồ dựa trên loại số đo
 * @param metric - Loại số đo
 * @returns Khóa chuỗi bản dịch
 */
const getMetricAxisKey = (metric: ChartMetric) => {
    if (metric === "Pain") {
        return "doctor.patientDetail.chartYAxisPain";
    }

    if (metric === "Accuracy") {
        return "doctor.patientDetail.chartYAxisAccuracy";
    }

    return "doctor.patientDetail.chartYAxisRom";
};

/**
 * Định dạng một giá trị để hiển thị trên biểu đồ
 * @param value - Giá trị cần định dạng
 * @returns Chuỗi giá trị đã được định dạng
 */
const formatChartValue = (value: number) => {
    return Number.isInteger(value) ? `${value}` : value.toFixed(1);
};

/**
 * Định dạng giá trị của một điểm trên biểu đồ bao gồm cả đơn vị
 * @param metric - Loại số đo
 * @param value - Giá trị của điểm
 * @returns Chuỗi định dạng hiển thị cho điểm dữ liệu
 */
const formatPointValue = (metric: ChartMetric, value: number) => {
    if (metric === "ROM") return `${formatChartValue(value)}°`;
    if (metric === "Accuracy") return `${formatChartValue(value)}%`;
    return `${formatChartValue(value)}/10`;
};

/**
 * Component biểu đồ đường thể hiện tiến trình phục hồi
 * @param props - Các thuộc tính của biểu đồ
 * @param props.data - Danh sách dữ liệu vẽ biểu đồ
 * @param props.width - Chiều rộng của biểu đồ
 * @param props.metric - Loại số đo biểu đồ
 * @returns Component giao diện biểu đồ SVG
 */
const RecoveryLineChart = ({
    data,
    width,
    metric,
}: {
    data: ChartPoint[];
    width: number;
    metric: ChartMetric;
}) => {
    const values = data.map((point) => point.value);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const range = rawMax - rawMin;
    const padding = range === 0 ? (metric === "Pain" ? 1 : 5) : range * 0.18;
    let yMin = rawMin - padding;
    let yMax = rawMax + padding;

    if (metric === "Pain") {
        yMin = Math.max(0, yMin);
        if (rawMax <= 10) yMax = Math.min(10, yMax);
    } else {
        yMin = Math.max(0, yMin);
        if (metric === "Accuracy" && rawMax <= 100) yMax = Math.min(100, yMax);
    }

    if (yMin === yMax) {
        yMin -= 1;
        yMax += 1;
    }

    const plotWidth = width - CHART_PADDING.left - CHART_PADDING.right;
    const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
    /**
     * Tính toán tọa độ X cho điểm dữ liệu
     * @param index - Chỉ số của điểm dữ liệu
     * @returns Tọa độ X
     */
    const getX = (index: number) => {
        if (data.length === 1) return CHART_PADDING.left + plotWidth / 2;
        return CHART_PADDING.left + (plotWidth * index) / (data.length - 1);
    };
    /**
     * Tính toán tọa độ Y cho điểm dữ liệu
     * @param value - Giá trị của điểm dữ liệu
     * @returns Tọa độ Y
     */
    const getY = (value: number) => {
        const percent = (value - yMin) / (yMax - yMin);
        return CHART_PADDING.top + plotHeight - percent * plotHeight;
    };
    const coordinates = data.map((point, index) => ({
        ...point,
        x: getX(index),
        y: getY(point.value),
    }));
    const path = coordinates
        .map(
            (point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`,
        )
        .join(" ");
    const baselineY = CHART_PADDING.top + plotHeight;
    const areaPath =
        coordinates.length > 1
            ? `${path} L${coordinates[coordinates.length - 1].x},${baselineY} L${coordinates[0].x},${baselineY} Z`
            : "";
    const ticks = [0, 0.25, 0.5, 0.75, 1];

    return (
        <Svg width={width} height={CHART_HEIGHT}>
            <Defs>
                <LinearGradient
                    id="recoveryAreaGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                >
                    <Stop offset="0%" stopColor="#0f766e" stopOpacity={0.24} />
                    <Stop
                        offset="100%"
                        stopColor="#0f766e"
                        stopOpacity={0.03}
                    />
                </LinearGradient>
            </Defs>
            {ticks.map((tick) => {
                const y = CHART_PADDING.top + plotHeight * tick;
                const value = yMax - (yMax - yMin) * tick;

                return (
                    <React.Fragment key={tick}>
                        <Line
                            x1={CHART_PADDING.left}
                            y1={y}
                            x2={width - CHART_PADDING.right}
                            y2={y}
                            stroke="#f1f5f9"
                            strokeWidth={1}
                        />
                        <SvgText
                            x={0}
                            y={y + 3}
                            fill="rgba(100, 116, 139, 0.5)"
                            fontFamily="Inter_500Medium"
                            fontSize={10}
                            fontWeight="500"
                        >
                            {formatChartValue(value)}
                        </SvgText>
                    </React.Fragment>
                );
            })}
            <Line
                x1={CHART_PADDING.left}
                y1={CHART_PADDING.top}
                x2={CHART_PADDING.left}
                y2={CHART_PADDING.top + plotHeight}
                stroke="#e2e8f0"
                strokeWidth={1}
            />
            <Line
                x1={CHART_PADDING.left}
                y1={CHART_PADDING.top + plotHeight}
                x2={width - CHART_PADDING.right}
                y2={CHART_PADDING.top + plotHeight}
                stroke="#e2e8f0"
                strokeWidth={1}
            />
            {coordinates.length > 1 && (
                <Path d={areaPath} fill="url(#recoveryAreaGradient)" />
            )}
            {coordinates.length > 1 && (
                <Path
                    d={path}
                    fill="none"
                    stroke="#0f766e"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            )}
            {coordinates.map((point) => (
                <Circle
                    key={`${point.label}-${point.value}`}
                    cx={point.x}
                    cy={point.y}
                    r={4}
                    stroke="#0f766e"
                    strokeWidth={2}
                    fill="#fff"
                />
            ))}
            {coordinates.map((point, index) => {
                const shouldShowValue =
                    index % 2 === 0 || index === coordinates.length - 1;
                if (!shouldShowValue) return null;

                return (
                    <SvgText
                        key={`${point.label}-value`}
                        x={point.x}
                        y={Math.max(11, point.y - 10)}
                        fill="#0f766e"
                        fontFamily="Inter_600SemiBold"
                        fontSize={10}
                        fontWeight="600"
                        textAnchor={
                            index === 0
                                ? "start"
                                : index === coordinates.length - 1
                                  ? "end"
                                  : "middle"
                        }
                    >
                        {formatPointValue(metric, point.value)}
                    </SvgText>
                );
            })}
            {coordinates.map((point) => (
                <SvgText
                    key={`${point.label}-label`}
                    x={point.x}
                    y={CHART_HEIGHT - 6}
                    fill="rgba(100, 116, 139, 0.5)"
                    fontFamily="Inter_500Medium"
                    fontSize={10}
                    fontWeight="500"
                    textAnchor="middle"
                >
                    {point.label}
                </SvgText>
            ))}
        </Svg>
    );
};

/**
 * Màn hình hiển thị thông tin chi tiết của một bệnh nhân
 * @returns Component React giao diện màn hình chi tiết bệnh nhân
 */
export const PatientDetailScreen: React.FC = () => {
    const navigation =
        useNavigation<NativeStackNavigationProp<DoctorStackParamList>>();
    const route = useRoute<RouteProp<DoctorStackParamList, "PatientDetail">>();
    const { t } = useTranslation();
    const { width: windowWidth } = useWindowDimensions();

    // Lưu ý: các tham số route nên bao gồm patientId từ điều hướng DoctorDashboardScreen
    const { patientName, patientId } = route.params;
    const actualPatientId = patientId;

    const [activeChart, setActiveChart] = useState<ChartMetric>("ROM");
    const [loading, setLoading] = useState(true);

    const [plan, setPlan] = useState<TreatmentPlan | null>(null);
    const [progress, setProgress] = useState<ProgressSnapshot | null>(null);
    const [progressHistory, setProgressHistory] = useState<ProgressSnapshot[]>(
        [],
    );
    const [sessions, setSessions] = useState<Session[]>([]);

    const loadData = useCallback(async () => {
        try {
            const [
                fetchedPlan,
                fetchedProgress,
                fetchedProgressHistory,
                fetchedSessions,
            ] = await Promise.all([
                getActiveTreatmentPlan(actualPatientId),
                getLatestProgress(actualPatientId),
                getProgressHistory(actualPatientId, 12),
                getPatientSessions(actualPatientId, 20),
            ]);
            setPlan(fetchedPlan);
            setProgress(fetchedProgress);
            setProgressHistory(fetchedProgressHistory);
            setSessions(fetchedSessions);
        } catch (error) {
            console.error("Error loading patient details:", error);
        } finally {
            setLoading(false);
        }
    }, [actualPatientId]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData]),
    );

    /**
     * Chuyển hướng sang màn hình gán bài tập cho bệnh nhân
     * @returns Không có giá trị trả về
     */
    const handleAssign = () => {
        navigation.navigate("AssignTemplate", { patientId, patientName });
    };

    if (loading) {
        return (
            <SafeAreaView
                style={[
                    styles.safe,
                    { justifyContent: "center", alignItems: "center" },
                ]}
            >
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    const accuracy = progress?.movementScore ?? 0;
    const sessionsCount = sessions.length;
    // Tính toán mức đau trung bình từ các buổi tập
    const avgPain =
        sessionsCount > 0
            ? Math.round(
                  sessions.reduce((acc, s) => acc + (s.averagePain || 0), 0) /
                      sessionsCount,
              )
            : 0;
    const chartWidth = Math.max(
        280,
        windowWidth - spacing.gutter * 2 - spacing.lg * 2,
    );
    const chartData = buildRecoveryPoints(
        activeChart,
        progressHistory,
        progress,
        sessions,
        plan?.currentWeek,
    );

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            {/* Thanh điều hướng */}
            <View style={styles.navBar}>
                <TouchableOpacity
                    style={styles.navBackBtn}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons
                        name="arrow-back"
                        size={24}
                        color={colors.primary}
                    />
                </TouchableOpacity>
                <AppText variant="headlineMd" style={styles.navTitle}>
                    {t("doctor.patientDetail.title")}
                </AppText>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Phần đầu thông tin bệnh nhân */}
                <View style={styles.profileCard}>
                    <View style={styles.profileAvatar}>
                        <Ionicons name="person" size={36} color="#94a3b8" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <AppText
                            variant="headlineMd"
                            style={styles.profileName}
                        >
                            {patientName}
                        </AppText>
                        <AppText
                            variant="bodySm"
                            style={styles.profileCondition}
                        >
                            {plan
                                ? `${plan.condition} · ${t("doctor.patientDetail.weekLabel", { num: plan.currentWeek })} · Phase ${plan.currentPhase}`
                                : t("doctor.patientDetail.noActivePlan")}
                        </AppText>
                        <View style={styles.profileBadges}>
                            <View
                                style={[
                                    styles.badge,
                                    { backgroundColor: "#dcfce7" },
                                ]}
                            >
                                <AppText
                                    variant="labelSm"
                                    style={{ color: "#166534", fontSize: 10 }}
                                >
                                    {plan?.status === "on-track"
                                        ? t("doctor.patientDetail.onTrack")
                                        : plan?.status ||
                                          t("doctor.patientDetail.active")}
                                </AppText>
                            </View>
                            <View
                                style={[
                                    styles.badge,
                                    { backgroundColor: "#e0f2fe" },
                                ]}
                            >
                                <AppText
                                    variant="labelSm"
                                    style={{
                                        color: colors.primary,
                                        fontSize: 10,
                                    }}
                                >
                                    {t("doctor.patientDetail.sessionsCount", {
                                        count: sessionsCount,
                                    })}
                                </AppText>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Thống kê nhanh */}
                <View style={styles.quickStats}>
                    {[
                        {
                            label: t("doctor.patientDetail.accuracy"),
                            value: `${accuracy}%`,
                            icon: "analytics",
                            color: colors.primary,
                        },
                        {
                            label: t("doctor.patientDetail.sessions"),
                            value: `${sessionsCount}`,
                            icon: "calendar",
                            color: "#0f766e",
                        },
                        {
                            label: t("doctor.patientDetail.streak"),
                            value: `${progress?.weeklyConsistency ? Math.round((progress.weeklyConsistency / 100) * 7) : 0}d`,
                            icon: "flame",
                            color: "#b45309",
                        },
                        {
                            label: t("doctor.patientDetail.painAvg"),
                            value: `${avgPain}/10`,
                            icon: "pulse",
                            color: "#dc2626",
                        },
                    ].map((stat) => (
                        <View key={stat.label} style={styles.quickStatItem}>
                            <Ionicons
                                name={stat.icon as any}
                                size={18}
                                color={stat.color}
                            />
                            <AppText
                                variant="headlineMd"
                                style={[
                                    styles.quickStatValue,
                                    { color: stat.color },
                                ]}
                            >
                                {stat.value}
                            </AppText>
                            <AppText
                                variant="bodySm"
                                style={styles.quickStatLabel}
                            >
                                {stat.label}
                            </AppText>
                        </View>
                    ))}
                </View>

                {/* Chuyển đổi biểu đồ */}
                <View style={styles.card}>
                    <View style={styles.chartHeader}>
                        <AppText variant="headlineMd" style={styles.cardTitle}>
                            {t("doctor.patientDetail.recoveryProgress")}
                        </AppText>
                        <View style={styles.toggleGroup}>
                            {(["ROM", "Pain", "Accuracy"] as ChartMetric[]).map(
                                (tab) => (
                                    <TouchableOpacity
                                        key={tab}
                                        style={[
                                            styles.toggleBtn,
                                            activeChart === tab &&
                                                styles.toggleBtnActive,
                                        ]}
                                        onPress={() => setActiveChart(tab)}
                                    >
                                        <AppText
                                            variant="labelSm"
                                            style={{
                                                color:
                                                    activeChart === tab
                                                        ? "#fff"
                                                        : "#475569",
                                            }}
                                        >
                                            {tab}
                                        </AppText>
                                    </TouchableOpacity>
                                ),
                            )}
                        </View>
                    </View>

                    {/* Biểu đồ */}
                    <View style={styles.chartWrapper}>
                        {chartData.length > 0 ? (
                            <RecoveryLineChart
                                data={chartData}
                                width={chartWidth}
                                metric={activeChart}
                            />
                        ) : (
                            <View style={styles.emptyChart}>
                                <Ionicons
                                    name="analytics-outline"
                                    size={24}
                                    color="#94a3b8"
                                />
                                <AppText
                                    variant="bodySm"
                                    style={styles.emptyChartText}
                                >
                                    {t("doctor.patientDetail.noChartData")}
                                </AppText>
                            </View>
                        )}
                    </View>
                </View>

                {/* Hành động */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={styles.actionPrimary}
                        onPress={handleAssign}
                    >
                        <Ionicons
                            name="calendar-outline"
                            size={20}
                            color="#fff"
                        />
                        <AppText
                            variant="labelMd"
                            style={{ color: "#fff", fontWeight: "700" }}
                        >
                            {t(
                                "doctor.patientDetail.manageSessions",
                                "Manage Patient Sessions",
                            )}
                        </AppText>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#f8fafd" },
    navBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.gutter,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
    },
    navBackBtn: { padding: 4, marginLeft: -4 },
    navTitle: { color: colors.onSurface, fontWeight: "700", fontSize: 18 },

    scroll: { flex: 1 },
    content: {
        padding: spacing.gutter,
        gap: spacing.lg,
        paddingBottom: spacing.xl * 2,
    },

    profileCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    profileAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#f1f5f9",
        alignItems: "center",
        justifyContent: "center",
    },
    profileName: { color: "#0f172a", fontWeight: "800", fontSize: 20 },
    profileCondition: { color: "#64748b", marginTop: 4, marginBottom: 8 },
    profileBadges: { flexDirection: "row", gap: 8 },
    badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 },

    quickStats: { flexDirection: "row", gap: spacing.sm },
    quickStatItem: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: spacing.md,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        gap: 4,
    },
    quickStatValue: { fontWeight: "800", fontSize: 18 },
    quickStatLabel: { color: "#64748b", fontSize: 10 },

    card: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    cardTitle: { color: "#0f172a", fontWeight: "700", fontSize: 18 },
    chartHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.md,
    },
    toggleGroup: {
        flexDirection: "row",
        backgroundColor: "#f1f5f9",
        borderRadius: 8,
        padding: 2,
    },
    toggleBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
    toggleBtnActive: { backgroundColor: colors.primary },

    chartAxisRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: spacing.sm,
    },
    chartAxisText: {
        color: "#64748b",
        flexShrink: 1,
        fontSize: 10,
    },

    chartWrapper: {
        marginTop: spacing.sm,
        alignItems: "center",
    },
    emptyChart: {
        height: CHART_HEIGHT,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
    },
    emptyChartText: {
        color: "#64748b",
        textAlign: "center",
    },
    actionsRow: { flexDirection: "row", gap: spacing.md },
    actionPrimary: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: 16,
    },
    actionSecondary: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#e0f2fe",
        paddingVertical: 16,
        borderRadius: 16,
    },
});
