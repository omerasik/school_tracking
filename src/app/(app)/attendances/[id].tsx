import { useTheme } from "@/src/context/ThemeContext";
import { getAttendances } from "@core/modules/attendances/api.attendances";
import { AttendanceWithProfile } from "@core/modules/attendances/types.attendances";
import { getCourseById } from "@core/modules/courses/api.courses";
import { CourseWithCampus } from "@core/modules/courses/types.courses";
import DefaultView from "@design/View/DefaultView";
import { Ionicons } from "@expo/vector-icons";
import useUser from "@functional/auth/useUser";
import DataView from "@functional/Data/DataView";
import { attendancesDetailStyles } from "@style/attendances.styling";
import { Colors, getThemeColors } from "@style/theme";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

const AttendancesDetailLayout = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useUser();
  const { isDark } = useTheme();
  const themeColors = getThemeColors(isDark);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = [
      "Maandag",
      "Dinsdag",
      "Woensdag",
      "Donderdag",
      "Vrijdag",
      "Zaterdag",
      "Zondag",
    ];
    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
    const dayName = days[dayIndex];
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${dayName} ${day}/${month}/${year}`;
  };

  const getCourseStatus = (
    course: CourseWithCampus,
    attendances: AttendanceWithProfile[]
  ) => {
    if (!user) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const courseDate = new Date(course.date);
    courseDate.setHours(0, 0, 0, 0);

    const isUpcoming = courseDate > today;

    if (isUpcoming) return "upcoming";

    const attendance = attendances.find(
      (a) =>
        a.user_id === user.id &&
        a.date === course.date &&
        a.course_id === course.id
    );

    if (attendance) {
      return attendance.is_present ? "present" : "absent";
    }

    return null;
  };

  return (
    <DataView
      queryKey={["course", id || ""]}
      queryFn={async () => {
        if (!id) throw new Error("Geen course ID opgegeven");
        const [course, attendances] = await Promise.all([
          getCourseById(Number(id)),
          getAttendances(),
        ]);
        if (!course) throw new Error("Les niet gevonden");
        return { course, attendances };
      }}
      render={({ course, attendances }) => {
        const status = getCourseStatus(course, attendances);
        let statusIcon: any = "time-outline";
        let statusColor = Colors.gray[400];
        let statusText = "Binnenkort";

        if (status === "present") {
          statusIcon = "checkmark-circle";
          statusColor = Colors.success["500"];
          statusText = "Aanwezig";
        } else if (status === "absent") {
          statusIcon = "close-circle";
          statusColor = Colors.error["500"];
          statusText = "Afwezig";
        }

        const textColor = { color: themeColors.text };
        const labelColor = { color: themeColors.textSecondary };
        const cardStyle = {
          backgroundColor: themeColors.card,
          borderColor: themeColors.border,
        };
        const iconBadgeStyle = {
          backgroundColor: isDark ? Colors.gray[800] : Colors.primary["100"],
        };

        return (
          <DefaultView padding={false}>
            {/* Hero Status Section */}
            <View
              style={[
                attendancesDetailStyles.heroSection,
                {
                  backgroundColor:
                    status === "present"
                      ? Colors.success["500"]
                      : status === "absent"
                      ? Colors.error["500"]
                      : Colors.primary["500"],
                },
              ]}
            >
              <Ionicons
                name={statusIcon}
                size={32}
                color={Colors.white}
                style={attendancesDetailStyles.heroIcon}
              />
              <Text style={attendancesDetailStyles.heroTitle}>
                {statusText}
              </Text>
              <Text style={attendancesDetailStyles.heroDate}>
                {formatDate(course.date)}
              </Text>
            </View>

            {/* Course Name Card */}
            <View style={[attendancesDetailStyles.courseNameCard, cardStyle]}>
              <Text style={[attendancesDetailStyles.courseNameText, textColor]}>
                {course.course_name}
              </Text>
            </View>

            {/* Time & Location Section */}
            <View style={[attendancesDetailStyles.sectionCard, cardStyle]}>
              <Text style={[attendancesDetailStyles.sectionTitle, textColor]}>
                Tijd & Locatie
              </Text>

              <View style={attendancesDetailStyles.detailsContainer}>
                <View style={attendancesDetailStyles.detailItem}>
                  <View
                    style={[attendancesDetailStyles.iconBadge, iconBadgeStyle]}
                  >
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={Colors.primary["500"]}
                    />
                  </View>
                  <View style={attendancesDetailStyles.detailContent}>
                    <Text
                      style={[attendancesDetailStyles.detailLabel, labelColor]}
                    >
                      Tijd
                    </Text>
                    <Text
                      style={[attendancesDetailStyles.detailValue, textColor]}
                    >
                      {course.start_time.substring(0, 5)} -{" "}
                      {course.end_time.substring(0, 5)}
                    </Text>
                  </View>
                </View>

                <View style={attendancesDetailStyles.detailItem}>
                  <View
                    style={[attendancesDetailStyles.iconBadge, iconBadgeStyle]}
                  >
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color={Colors.primary["500"]}
                    />
                  </View>
                  <View style={attendancesDetailStyles.detailContent}>
                    <Text
                      style={[attendancesDetailStyles.detailLabel, labelColor]}
                    >
                      Lokaal
                    </Text>
                    <Text
                      style={[attendancesDetailStyles.detailValue, textColor]}
                    >
                      {course.classroom}
                    </Text>
                  </View>
                </View>

                {course.campuses && (
                  <View style={attendancesDetailStyles.detailItem}>
                    <View
                      style={[
                        attendancesDetailStyles.iconBadge,
                        iconBadgeStyle,
                      ]}
                    >
                      <Ionicons
                        name="business-outline"
                        size={20}
                        color={Colors.primary["500"]}
                      />
                    </View>
                    <View style={attendancesDetailStyles.detailContent}>
                      <Text
                        style={[
                          attendancesDetailStyles.detailLabel,
                          labelColor,
                        ]}
                      >
                        Campus
                      </Text>
                      <Text
                        style={[attendancesDetailStyles.detailValue, textColor]}
                      >
                        {course.campuses.name}
                      </Text>
                      <Text
                        style={[
                          attendancesDetailStyles.detailSubValue,
                          labelColor,
                        ]}
                      >
                        {course.campuses.location}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={attendancesDetailStyles.detailItem}>
                  <View
                    style={[attendancesDetailStyles.iconBadge, iconBadgeStyle]}
                  >
                    <Ionicons
                      name={
                        course.lesson_type === "live@campus"
                          ? "business-outline"
                          : "home-outline"
                      }
                      size={20}
                      color={Colors.primary["500"]}
                    />
                  </View>
                  <View style={attendancesDetailStyles.detailContent}>
                    <Text
                      style={[attendancesDetailStyles.detailLabel, labelColor]}
                    >
                      Type Les
                    </Text>
                    <Text
                      style={[
                        attendancesDetailStyles.detailValue,
                        { textTransform: "capitalize" },
                        textColor,
                      ]}
                    >
                      {course.lesson_type}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Teachers Section */}
            {course.teacher_names && course.teacher_names.length > 0 && (
              <View
                style={[
                  attendancesDetailStyles.sectionCard,
                  attendancesDetailStyles.sectionCardBottom,
                  cardStyle,
                ]}
              >
                <Text style={[attendancesDetailStyles.sectionTitle, textColor]}>
                  Docenten
                </Text>
                <View style={attendancesDetailStyles.teachersContainer}>
                  <View style={attendancesDetailStyles.detailItem}>
                    <View
                      style={[
                        attendancesDetailStyles.iconBadge,
                        iconBadgeStyle,
                      ]}
                    >
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color={Colors.primary["500"]}
                      />
                    </View>
                    <Text
                      style={[
                        attendancesDetailStyles.detailValue,
                        { flex: 1 },
                        textColor,
                      ]}
                    >
                      {course.teacher_names.join(", ")}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </DefaultView>
        );
      }}
    />
  );
};

export default AttendancesDetailLayout;
