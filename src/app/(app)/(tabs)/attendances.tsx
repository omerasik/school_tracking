import { useTheme } from "@/src/context/ThemeContext";
import { attandancesStyles } from "@/src/style/attendances.styling";
import { getThemeColors, Colors, Fonts, FontSizes, Spacing, BorderRadius } from "@/src/style/theme";
import { getAttendances } from "@core/modules/attendances/api.attendances";
import { AttendanceWithProfile } from "@core/modules/attendances/types.attendances";
import { getCourses, getTodayCourses } from "@core/modules/courses/api.courses";
import { CourseWithCampus } from "@core/modules/courses/types.courses";
import { API } from "@core/network/supabase/api";
import ErrorMessage from "@design/Alert/ErrorMessage";
import AnimatedListItem from "@design/List/AnimatedListItem";
import { AttendanceCardSkeleton } from "@design/Loading/SkeletonLoader";
import AnimatedTabView from "@design/View/AnimatedTabView";
import DefaultView from "@design/View/DefaultView";
import EmptyView from "@design/View/EmptyView";
import { Ionicons } from "@expo/vector-icons";
import useUser from "@functional/auth/useUser";
import { useFeedback } from "@functional/feedback/useFeedback";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

type FilterStatus = "all" | "present" | "absent";
type FilterChip = {
  key: FilterStatus;
  label: string;
  activeStyle?: ViewStyle;
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const getCourseTimeStatus = (course: CourseWithCampus): "upcoming" | "active" | "past" => {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const today = now.toISOString().split("T")[0];
  const courseDate = course.date;

  if (courseDate > today) return "upcoming";
  if (courseDate < today) return "past";

  const start = toMinutes(course.start_time?.substring(0, 5) ?? "00:00");
  const end = toMinutes(course.end_time?.substring(0, 5) ?? "23:59");

  if (nowMin < start) return "upcoming";
  if (nowMin > end) return "past";
  return "active";
};

// ─── Docent Dashboard Component ─────────────────────────────────────────────
const DocentDashboard = () => {
  const router = useRouter();
  const feedback = useFeedback();
  const { isDark } = useTheme();
  const themeColors = getThemeColors(isDark);

  const [todayCourses, setTodayCourses] = useState<CourseWithCampus[] | null>(null);
  const [attendances, setAttendances] = useState<AttendanceWithProfile[] | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const cardStyle = { backgroundColor: themeColors.card, borderColor: themeColors.border };

  useEffect(() => {
    loadData();
    const sub = API.channel("att-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "attendances" }, loadData)
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, []);

  const loadData = async () => {
    try {
      const [tc, att] = await Promise.all([getTodayCourses(), getAttendances()]);
      setTodayCourses(tc);
      setAttendances(att);
      // Auto-select active course
      const active = tc.find(c => getCourseTimeStatus(c) === "active");
      if (active) setSelectedCourse(prev => prev ?? active.id);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleMarkAsGoneHome = async (id: number, name: string) => {
    try {
      const { error } = await API.from("attendances")
        .update({ is_present: false, check_out_time: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      await feedback.success();
      loadData();
    } catch (e: any) {
      await feedback.error();
      Alert.alert("Fout", e.message);
    }
  };

  if (error) return <DefaultView><ErrorMessage error={error} /></DefaultView>;
  if (!todayCourses || !attendances) {
    return (
      <DefaultView>
        {Array.from({ length: 4 }).map((_, i) => <AttendanceCardSkeleton key={i} />)}
      </DefaultView>
    );
  }

  const now = new Date();
  const dayNames = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
  const todayLabel = `${dayNames[now.getDay()]} ${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")}`;

  const filteredAttendances = attendances.filter(a => {
    if (selectedCourse) {
      if (a.course_id !== selectedCourse && a.courses?.id !== selectedCourse) return false;
    }
    if (filterStatus === "present" && !a.is_present) return false;
    if (filterStatus === "absent" && a.is_present) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = `${a.profiles.first_name} ${a.profiles.last_name}`.toLowerCase();
      if (!name.includes(q)) return false;
    }
    return true;
  });

  const presentCount = filteredAttendances.filter(a => a.is_present).length;
  const absentCount = filteredAttendances.filter(a => !a.is_present).length;

  // Group by course
  const listData: any[] = [];
  const groupedMap = new Map<string, AttendanceWithProfile[]>();
  
  filteredAttendances.forEach(a => {
    const cName = a.courses?.course_name || a.course_name || "Overige";
    if (!groupedMap.has(cName)) groupedMap.set(cName, []);
    groupedMap.get(cName)!.push(a);
  });

  Array.from(groupedMap.keys()).forEach(cName => {
    listData.push({ isHeader: true, id: `header-${cName}`, title: cName });
    groupedMap.get(cName)!.forEach(a => listData.push({ isHeader: false, ...a }));
  });

  const handleStudentPress = (item: AttendanceWithProfile) => {
    if (!item.is_present) return;
    
    Alert.alert(
      "Student Beheren",
      `Wat wil je doen met ${item.profiles.first_name} ${item.profiles.last_name}?`,
      [
        { text: "Annuleren", style: "cancel" },
        { 
          text: "Uitchecken (Naar huis)", 
          style: "destructive",
          onPress: () => handleMarkAsGoneHome(item.id, `${item.profiles.first_name} ${item.profiles.last_name}`)
        }
      ]
    );
  };

  return (
    <DefaultView padding={false}>
      {/* ── TODAY HEADER ── */}
      <View style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.lg, paddingBottom: Spacing.sm }}>
        <Text style={{ fontSize: FontSizes.xs, fontFamily: Fonts.semiBold, color: themeColors.textTertiary, textTransform: "uppercase", letterSpacing: 1 }}>
          Vandaag
        </Text>
        <Text style={{ fontSize: FontSizes.xl, fontFamily: Fonts.bold, color: themeColors.text, marginTop: 2 }}>
          {todayLabel}
        </Text>
      </View>

      {/* ── TODAY'S COURSES ── */}
      {todayCourses.length === 0 ? (
        <View style={{ marginHorizontal: Spacing.md, marginBottom: Spacing.md, padding: Spacing.xl, backgroundColor: themeColors.card, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: themeColors.border, alignItems: "center", gap: Spacing.sm }}>
          <Ionicons name="calendar-outline" size={32} color={themeColors.textTertiary} />
          <Text style={{ fontFamily: Fonts.semiBold, color: themeColors.textSecondary, fontSize: FontSizes.default }}>Geen lessen vandaag</Text>
          <Text style={{ fontFamily: Fonts.regular, color: themeColors.textTertiary, fontSize: FontSizes.sm, textAlign: "center" }}>
            Er zijn geen lessen ingepland voor vandaag.
          </Text>
        </View>
      ) : (
        <FlatList
          data={todayCourses}
          horizontal
          scrollEnabled={true}
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.md }}
          renderItem={({ item }) => {
            const status = getCourseTimeStatus(item);
            const isSelected = selectedCourse === item.id;
            const accentColor = status === "active" ? Colors.success["500"] : status === "past" ? themeColors.textTertiary : themeColors.primary;
            return (
              <TouchableOpacity
                onPress={() => setSelectedCourse(isSelected ? null : item.id)}
                style={{
                  width: 200,
                  padding: Spacing.md,
                  borderRadius: BorderRadius.xl,
                  backgroundColor: isSelected ? themeColors.primary : themeColors.card,
                  borderWidth: 1,
                  borderColor: isSelected ? themeColors.primary : themeColors.border,
                  gap: Spacing.xs,
                }}
                activeOpacity={0.8}
              >
                {/* Status badge */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accentColor }} />
                  <Text style={{ fontSize: 10, fontFamily: Fonts.semiBold, color: isSelected ? "rgba(255,255,255,0.8)" : accentColor, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {status === "active" ? "• Nu actief" : status === "past" ? "Voorbij" : "Gepland"}
                  </Text>
                </View>
                <Text style={{ fontSize: FontSizes.default, fontFamily: Fonts.bold, color: isSelected ? Colors.white : themeColors.text }} numberOfLines={2}>
                  {item.course_name}
                </Text>
                <Text style={{ fontSize: FontSizes.xs, fontFamily: Fonts.regular, color: isSelected ? "rgba(255,255,255,0.7)" : themeColors.textSecondary }}>
                  {item.start_time?.substring(0,5)} – {item.end_time?.substring(0,5)}
                </Text>
                <Text style={{ fontSize: FontSizes.xs, fontFamily: Fonts.regular, color: isSelected ? "rgba(255,255,255,0.7)" : themeColors.textTertiary }}>
                  📍 {item.classroom}
                </Text>
                {/* Go to scan CTA */}
                {status === "active" && (
                  <TouchableOpacity
                    onPress={() => router.push("/(app)/(tabs)/qrs")}
                    style={{ marginTop: Spacing.xs, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : Colors.primary["500"], paddingVertical: 6, paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.full }}
                  >
                    <Ionicons name="qr-code-outline" size={14} color={Colors.white} />
                    <Text style={{ fontSize: FontSizes.xs, fontFamily: Fonts.bold, color: Colors.white }}>QR Sessie starten</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ── STATS BAR ── */}
      <View style={[attandancesStyles.statsBar, { marginHorizontal: Spacing.md, marginBottom: Spacing.md }]}>
        <View style={[attandancesStyles.statItem, { backgroundColor: Colors.success["500"] }]}>
          <Text style={[attandancesStyles.statValue, { color: Colors.white }]}>{presentCount}</Text>
          <Text style={[attandancesStyles.statLabel, { color: Colors.white, opacity: 0.85 }]}>Aanwezig</Text>
        </View>
        <View style={[attandancesStyles.statItem, { backgroundColor: Colors.error["500"] }]}>
          <Text style={[attandancesStyles.statValue, { color: Colors.white }]}>{absentCount}</Text>
          <Text style={[attandancesStyles.statLabel, { color: Colors.white, opacity: 0.85 }]}>Afwezig</Text>
        </View>
        <View style={[attandancesStyles.statItem, { backgroundColor: themeColors.card, borderWidth: 1, borderColor: themeColors.border }]}>
          <Text style={[attandancesStyles.statValue, { color: themeColors.primary }]}>{filteredAttendances.length}</Text>
          <Text style={[attandancesStyles.statLabel, { color: themeColors.textSecondary }]}>Totaal</Text>
        </View>
      </View>

      {/* ── SEARCH ── */}
      <View style={[attandancesStyles.searchContainer, { marginTop: 0 }]}>
        <TextInput
          style={[attandancesStyles.searchInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
          placeholder="Zoek op naam..."
          placeholderTextColor={themeColors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* ── FILTER CHIPS ── */}
      <View style={attandancesStyles.filterContainer}>
        {([
          { key: "all", label: `Alle (${filteredAttendances.length})` },
          { key: "present", label: `Aanwezig (${presentCount})`, activeStyle: attandancesStyles.filterButtonPresent },
          { key: "absent", label: `Afwezig (${absentCount})`, activeStyle: attandancesStyles.filterButtonAbsent },
        ] satisfies FilterChip[]).map(({ key, label, activeStyle }) => (
          <TouchableOpacity
            key={key}
            style={[attandancesStyles.filterButton, cardStyle, filterStatus === key && attandancesStyles.filterButtonActive, filterStatus === key && activeStyle]}
            onPress={() => setFilterStatus(key)}
          >
            <Text style={[attandancesStyles.filterButtonText, filterStatus === key ? attandancesStyles.filterButtonTextActive : { color: themeColors.textSecondary }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── ATTENDANCE LIST ── */}
      {filteredAttendances.length === 0 ? (
        <View style={{ alignItems: "center", paddingVertical: Spacing["2xl"], gap: Spacing.md }}>
          <Ionicons name="people-outline" size={40} color={themeColors.textTertiary} />
          <Text style={{ fontFamily: Fonts.semiBold, color: themeColors.textSecondary, fontSize: FontSizes.default }}>
            {selectedCourse ? "Geen studenten voor deze les" : "Nog geen aanwezigen"}
          </Text>
          <Text style={{ fontFamily: Fonts.regular, color: themeColors.textTertiary, fontSize: FontSizes.sm, textAlign: "center", paddingHorizontal: Spacing["2xl"] }}>
            {selectedCourse
              ? "Studenten scannen hun QR-code om in te checken."
              : "Selecteer een les hierboven of start een QR-sessie."}
          </Text>
          {todayCourses.find(c => getCourseTimeStatus(c) === "active") && (
            <TouchableOpacity
              onPress={() => router.push("/(app)/(tabs)/qrs")}
              style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.primary["500"], paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.full, marginTop: Spacing.sm }}
            >
              <Ionicons name="qr-code-outline" size={18} color={Colors.white} />
              <Text style={{ fontFamily: Fonts.bold, fontSize: FontSizes.default, color: Colors.white }}>QR Sessie starten</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={listData}
          scrollEnabled={false}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item, index }) => {
            if (item.isHeader) {
              return (
                <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.sm }}>
                  <Text style={{ fontSize: FontSizes.sm, fontFamily: Fonts.bold, color: themeColors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>
                    {item.title}
                  </Text>
                </View>
              );
            }

            const initials = `${item.profiles.first_name?.[0] ?? ""}${item.profiles.last_name?.[0] ?? ""}`.toUpperCase();
            const timeIn = item.check_in_time
              ? new Date(item.check_in_time).toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" })
              : "--:--";
            return (
              <AnimatedListItem index={index}>
                <TouchableOpacity 
                  activeOpacity={item.is_present ? 0.7 : 1}
                  onPress={() => handleStudentPress(item)}
                  style={[attandancesStyles.studentCard, cardStyle, item.is_present ? attandancesStyles.studentCardPresent : attandancesStyles.studentCardAbsent]}
                >
                  <View style={attandancesStyles.studentHeader}>
                    <View style={attandancesStyles.studentInfo}>
                      <View style={[attandancesStyles.studentAvatar, { backgroundColor: item.is_present ? Colors.success["100"] : Colors.error["100"] }]}>
                        <Text style={[attandancesStyles.studentAvatarText, { color: item.is_present ? Colors.success["600"] : Colors.error["600"] }]}>{initials}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[attandancesStyles.studentName, { color: themeColors.text }]} numberOfLines={1}>
                          {item.profiles.first_name} {item.profiles.last_name}
                        </Text>
                        <Text style={{ fontSize: FontSizes.xs, fontFamily: Fonts.regular, color: themeColors.textSecondary }}>
                          Ingecheckt om {timeIn}
                        </Text>
                      </View>
                    </View>
                    {item.is_present && (
                      <Ionicons name="ellipsis-vertical" size={20} color={themeColors.textTertiary} />
                    )}
                  </View>
                </TouchableOpacity>
              </AnimatedListItem>
            );
          }}
        />
      )}
    </DefaultView>
  );
};

// ─── Student View ────────────────────────────────────────────────────────────
const StudentView = () => {
  const router = useRouter();
  const user = useUser();
  const { isDark } = useTheme();
  const themeColors = getThemeColors(isDark);
  const [courses, setCourses] = useState<CourseWithCampus[] | null>(null);
  const [attendances, setAttendances] = useState<AttendanceWithProfile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const cardStyle = { backgroundColor: themeColors.card, borderColor: themeColors.border };

  useEffect(() => {
    Promise.all([getCourses(), getAttendances()])
      .then(([c, a]) => { setCourses(c); setAttendances(a); })
      .catch(e => setError(e.message));
  }, []);

  if (error) return <DefaultView><ErrorMessage error={error} /></DefaultView>;
  if (!courses || !attendances) {
    return <DefaultView>{Array.from({ length: 5 }).map((_, i) => <AttendanceCardSkeleton key={i} />)}</DefaultView>;
  }
  if (courses.length === 0) {
    return <EmptyView title="Geen Lessen" description="Er zijn geen lessen beschikbaar." icon="folder" />;
  }

  const getCourseStatus = (course: CourseWithCampus) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const courseDate = new Date(course.date); courseDate.setHours(0,0,0,0);
    if (courseDate > today) return "upcoming";
    const att = attendances?.find(a => a.user_id === user?.id && a.date === course.date && a.course_id === course.id);
    if (att) return att.is_present ? "present" : "absent";
    return null;
  };

  const present = courses.filter(c => getCourseStatus(c) === "present").length;
  const absent = courses.filter(c => getCourseStatus(c) === "absent").length;
  const pct = courses.length > 0 ? Math.round((present / courses.length) * 100) : 0;

  const filtered = courses.filter(course => {
    const status = getCourseStatus(course);
    if (filterStatus === "present" && status !== "present") return false;
    if (filterStatus === "absent" && status !== "absent") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return course.course_name.toLowerCase().includes(q) || course.classroom.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <DefaultView padding={false}>
      {/* Stats */}
      <View style={[attandancesStyles.statsBar, { margin: Spacing.md }]}>
        <View style={[attandancesStyles.statItem, { backgroundColor: Colors.success["500"] }]}>
          <Text style={[attandancesStyles.statValue, { color: Colors.white }]}>{present}</Text>
          <Text style={[attandancesStyles.statLabel, { color: Colors.white, opacity: 0.85 }]}>Aanwezig</Text>
        </View>
        <View style={[attandancesStyles.statItem, { backgroundColor: Colors.error["500"] }]}>
          <Text style={[attandancesStyles.statValue, { color: Colors.white }]}>{absent}</Text>
          <Text style={[attandancesStyles.statLabel, { color: Colors.white, opacity: 0.85 }]}>Afwezig</Text>
        </View>
        <View style={[attandancesStyles.statItem, { backgroundColor: themeColors.card, borderWidth: 1, borderColor: themeColors.border }]}>
          <Text style={[attandancesStyles.statValue, { color: themeColors.primary }]}>{pct}%</Text>
          <Text style={[attandancesStyles.statLabel, { color: themeColors.textSecondary }]}>Aanwezig %</Text>
        </View>
      </View>

      {/* Search */}
      <View style={attandancesStyles.searchContainer}>
        <TextInput
          style={[attandancesStyles.searchInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
          placeholder="Zoek op vak, lokaal..."
          placeholderTextColor={themeColors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View style={attandancesStyles.filterContainer}>
        {([
          { key: "all", label: `Alle (${courses.length})` },
          { key: "present", label: `Aanwezig (${present})`, activeStyle: attandancesStyles.filterButtonPresent },
          { key: "absent", label: `Afwezig (${absent})`, activeStyle: attandancesStyles.filterButtonAbsent },
        ] satisfies FilterChip[]).map(({ key, label, activeStyle }) => (
          <TouchableOpacity
            key={key}
            style={[attandancesStyles.filterButton, cardStyle, filterStatus === key && attandancesStyles.filterButtonActive, filterStatus === key && activeStyle]}
            onPress={() => setFilterStatus(key)}
          >
            <Text style={[attandancesStyles.filterButtonText, filterStatus === key ? attandancesStyles.filterButtonTextActive : { color: themeColors.textSecondary }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Course list */}
      <FlatList
        data={filtered}
        scrollEnabled={false}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item, index }) => {
          const status = getCourseStatus(item);
          const cardStyles: ViewStyle[] = [attandancesStyles.courseCard, cardStyle];
          let statusIcon: any = "time-outline";
          let statusColor = Colors.gray[400];
          if (status === "present") { cardStyles.push(attandancesStyles.courseCardPresent as ViewStyle); statusIcon = "checkmark-circle"; statusColor = Colors.success["500"]; }
          else if (status === "absent") { cardStyles.push(attandancesStyles.courseCardAbsent as ViewStyle); statusIcon = "close-circle"; statusColor = Colors.error["500"]; }
          else { cardStyles.push(attandancesStyles.courseCardUpcoming as ViewStyle); }
          return (
            <AnimatedListItem index={index}>
              <TouchableOpacity style={[...cardStyles, attandancesStyles.compactCourseCard]} onPress={() => router.push(`/(app)/attendances/${item.id}`)} activeOpacity={0.7}>
                <View style={attandancesStyles.compactCourseCardLeft}>
                  <Ionicons name={statusIcon} size={26} color={statusColor} style={attandancesStyles.compactCourseIcon} />
                  <View>
                    <Text style={[attandancesStyles.compactCourseName, { color: themeColors.text }]}>{item.course_name}</Text>
                    <Text style={[attandancesStyles.compactCourseDate, { color: themeColors.textSecondary }]}>
                      {item.start_time?.substring(0,5)} – {item.end_time?.substring(0,5)} · {item.classroom}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.gray[400]} />
              </TouchableOpacity>
            </AnimatedListItem>
          );
        }}
      />
    </DefaultView>
  );
};

// ─── Root Component ──────────────────────────────────────────────────────────
const AttendancesLayout = () => {
  const user = useUser();

  if (!user) return null;

  return (
    <AnimatedTabView>
      {user.role === "docent" ? <DocentDashboard /> : <StudentView />}
    </AnimatedTabView>
  );
};

export default AttendancesLayout;
