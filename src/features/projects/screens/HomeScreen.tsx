import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { fetchProjects } from "../services/projectService";
import ProjectCard from "../components/ProjectCard";
import type { ProjectCardPost } from "../components/ProjectCard";
import { COLORS } from '../../../theme/colors'; // Importa dal percorso corretto

export default function HomeScreen() {
  const [posts, setPosts] = useState<ProjectCardPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = async () => {
    const data = await fetchProjects();
    setPosts(data);
    setLoading(false);
  };

  const refreshData = async () => {
    setRefreshing(true);
    const data = await fetchProjects();
    setPosts(data);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>CREVIA</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.feed}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshData}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          <Text style={styles.feedTitle}>Per te</Text>
          {posts.map((post) => (
            <ProjectCard key={post.id} post={post} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 15,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    letterSpacing: 1,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  matchButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  matchText: { fontSize: 16, fontWeight: "bold", color: COLORS.primary },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  feed: { padding: 20, gap: 16, paddingBottom: 100 },
  feedTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.secondary,
    marginBottom: 4,
  },
});
