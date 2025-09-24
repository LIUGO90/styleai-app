import { View, StyleSheet } from "react-native";

export default function DotsContainer({
  activeIndex,
  indexNumber,
}: {
  activeIndex: number;
  indexNumber: number;
}) {
  return (
    <View className="m-5" style={styles.dotsContainer}>
      {Array.from({ length: indexNumber }).map((_, index) => (
        <View
          key={index}
          style={[styles.dot, activeIndex - 1 === index && styles.activeDot]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#d1d5db",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#000000",
    width: 24,
  },
});
