import React, { useEffect, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useRef } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Image,
  useWindowDimensions,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileScreen } from '../hooks/useProfileScreen';
import createStyles, { createModalStyles } from './ProfileScreen.styles';
import { useAppPreferences } from '../../../theme/AppPreferencesProvider';
import {
  LocalizedText as Text,
  LocalizedTextInput as TextInput,
} from '../../../i18n/LocalizedText';
import { TranslatedContent } from '../../../i18n/TranslatedContent';
import type { RootStackParamList } from '../../../navigation/types';
import { CURRENT_USER_ID } from '../../chat/services/chatService';
import ProfilePostCard from '../components/ProfilePostCard';

type PrivacyDraft = {
  privacyDataNascita: boolean;
  privacyNazione: boolean;
  privacyCitta: boolean;
};

type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const formattaDataMeseAnno = (
  date?: Date | string | null,
  language: 'it' | 'en' = 'it'
): string => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  const mesi = language === 'it'
    ? ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"]
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${mesi[d.getMonth()]} ${d.getFullYear()}`;
};

export default function ProfileScreen() {
  const { colors: COLORS, language } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const { width: viewportWidth } = useWindowDimensions();
  const tabPagerRef = useRef<ScrollView>(null);
  const [tabPagerWidth, setTabPagerWidth] = useState(0);
  const [tabPageHeights, setTabPageHeights] = useState({
    projects: 0,
    experiences: 0,
  });
  const pagerWidth = tabPagerWidth || Math.max(viewportWidth - 40, 1);
  const styles = useMemo(
    () => createStyles(COLORS, insets.top, insets.bottom),
    [COLORS, insets.bottom, insets.top]
  );
  const modalStyles = useMemo(
    () => createModalStyles(COLORS, insets.top, insets.bottom),
    [COLORS, insets.bottom, insets.top]
  );
  const navigation = useNavigation<RootNavigationProp>();
  const {
    profile,
    draftProfile,
    projects,
    experiences,
    posts,
    activeTab,
    loading,
    editingProfile,
    photoMenuVisible,
    isCoverPhotoMenu,
    isCreateProjectModalVisible,
    isProjectModalVisible,
    isExperienceModalVisible,
    selectedProject,
    selectedExperience,
    showInizioPicker,
    showFinePicker,
    refreshing,
    refreshProfileData,
    savePrivacySettings,
    startEditingProfile,
    cancelEditingProfile,
    updateDraftProfileField,
    saveProfile,
    openPhotoMenu,
    openCoverPhotoMenu,
    closePhotoMenu,
    handlePhotoChoice,
    openCreateProjectModal,
    closeCreateProjectModal,
    openProjectModal,
    closeProjectModal,
    saveProject,
    removeProject,
    pickSelectedProjectImage,
    openExperienceModal,
    closeExperienceModal,
    createNewExperience,
    saveExperience,
    removeExperience,
    updateSelectedExperienceValue,
    updateSelectedProjectValue,
    updateSelectedProjectOpenRoles,
    setActiveTab,
    setShowInizioPicker,
    setShowFinePicker,
    postEditorVisible,
    selectedPost,
    postDraftBody,
    postDraftImageUri,
    postSaving,
    postActionLoading,
    openCreatePost,
    openEditPost,
    closePostEditor,
    setPostDraftBody,
    setPostDraftImageUri,
    pickPostImage,
    savePost,
    removePost,
    togglePostLike,
    addPostComment,
    removePostComment,
  } = useProfileScreen();
  const activeTabHeight = tabPageHeights[activeTab];
  const [createMenuVisible, setCreateMenuVisible] = useState<boolean>(false);
  const [privacyEditMode, setPrivacyEditMode] = useState<boolean>(false);
  const [privacyDraft, setPrivacyDraft] = useState<PrivacyDraft>({
    privacyDataNascita: false,
    privacyNazione: false,
    privacyCitta: false,
  });

  const openCreateMenu = () => setCreateMenuVisible(true);
  const closeCreateMenu = () => setCreateMenuVisible(false);

  const openProjectPage = (projectId?: string) => {
    if (projectId) navigation.navigate('ProjectDetail', { projectId });
  };

  const openExperiencePage = (experienceId?: string) => {
    if (experienceId) {
      navigation.navigate('ProfileExperienceDetail', { experienceId });
    }
  };

  const openPostEntity = (
    entityType: 'user' | 'project',
    entityId: string
  ) => {
    if (entityType === 'project') {
      navigation.navigate('ProjectDetail', { projectId: entityId });
      return;
    }
    if (entityId !== (profile?.id ?? CURRENT_USER_ID)) {
      navigation.navigate('PublicUserProfile', { userId: entityId });
    }
  };

  const selectContentTab = (tab: 'projects' | 'experiences') => {
    const pageIndex = tab === 'projects' ? 0 : 1;
    setActiveTab(tab);
    tabPagerRef.current?.scrollTo({ x: pageIndex * pagerWidth, animated: true });
  };

  const handleCreateProject = async () => {
    const savedProject = await saveProject();
    if (savedProject?.id) {
      navigation.navigate('ProjectDetail', { projectId: savedProject.id });
    }
  };


  const handleSaveProject = async () => {
    await saveProject();
  };

  useFocusEffect(
    useCallback(() => {
      void refreshProfileData();
    }, [refreshProfileData])
  );

  useEffect(() => {
    if (profile) {
      setPrivacyDraft({
        privacyDataNascita: profile.privacyDataNascita,
        privacyNazione: profile.privacyNazione,
        privacyCitta: profile.privacyCitta,
      });
    }
  }, [profile]);

  const togglePrivacyDraftField = (field: keyof PrivacyDraft) => {
    setPrivacyDraft((current) => ({ ...current, [field]: !current[field] }));
  };

  const handlePrivacyEditToggle = async () => {
    if (!privacyEditMode) {
      setPrivacyEditMode(true);
      return;
    }

    await savePrivacySettings({
      privacyDataNascita: privacyDraft.privacyDataNascita,
      privacyNazione: privacyDraft.privacyNazione,
      privacyCitta: privacyDraft.privacyCitta,
    });
    setPrivacyEditMode(false);
  };

  if (loading && !profile) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mio Profilo</Text>
        <View style={styles.headerIconsContainer}>
          <TouchableOpacity style={styles.headerIcon} onPress={openCreateMenu}>
            <Ionicons name="add-circle" size={25} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerIcon, editingProfile && styles.headerIconActive]}
            onPress={editingProfile ? saveProfile : startEditingProfile}
          >
            <Ionicons
              name={editingProfile ? "checkmark-circle" : "create-outline"}
              size={24}
              color={editingProfile ? COLORS.confirm : COLORS.secondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={23} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshProfileData}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={styles.profileCard}>
          <TouchableOpacity
            activeOpacity={0.86}
            style={styles.coverContainer}
            onPress={openCoverPhotoMenu}
          >
            {profile?.fotoCopertina ? (
              <Image
                source={{ uri: profile.fotoCopertina }}
                style={styles.coverImage}
              />
            ) : (
              <View style={styles.coverFallback}>
                <Ionicons name="shapes-outline" size={38} color={COLORS.white} />
              </View>
            )}
            <View style={styles.editCoverButton}>
              <Ionicons name="camera" size={16} color={COLORS.white} />
            </View>
          </TouchableOpacity>

          <View style={styles.profileContent}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity style={styles.avatar} onPress={openPhotoMenu}>
                {profile?.foto ? (
                  <Image source={{ uri: profile.foto }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={40} color={COLORS.primary} />
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.editAvatarButton} onPress={openPhotoMenu}>
                <Ionicons name="camera" size={15} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            {!editingProfile ? (
              <>
                <Text style={styles.profileName}>{profile?.nome}</Text>
                <Text style={styles.profileRuolo}>{profile?.ruolo} • {profile?.settore}</Text>
                {profile?.isBuilder && (
                  <View style={styles.builderBadge}>
                    <Ionicons name="construct-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.builderBadgeText}>Builder</Text>
                  </View>
                )}
                <TranslatedContent
                  contentId={`profile:${profile?.id ?? 'current'}:bio`}
                  sourceLanguage={profile?.bioLanguage ?? 'it'}
                  text={profile?.bio ?? ''}
                  style={styles.bioText}
                />
              </>
            ) : (
              <View style={styles.editUserForm}>
                <Text style={styles.editLabel}>Nome e Cognome</Text>
                <TextInput
                  style={styles.editInput}
                  value={draftProfile.nome}
                  onChangeText={(text) => updateDraftProfileField('nome', text)}
                />
                <Text style={styles.editLabel}>Qualifica / Ruolo</Text>
                <TextInput
                  style={styles.editInput}
                  value={draftProfile.ruolo}
                  onChangeText={(text) => updateDraftProfileField('ruolo', text)}
                />
                <Text style={styles.editLabel}>Biografia</Text>
                <TextInput
                  style={[styles.editInput, { height: 60 }]}
                  multiline
                  value={draftProfile.bio}
                  onChangeText={(text) => updateDraftProfileField('bio', text)}
                />
                <TouchableOpacity style={styles.buttonDelete} onPress={cancelEditingProfile}>
                  <Text style={styles.buttonDeleteText}>Annulla</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.statsContainer}>
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.statBox}
                onPress={() => navigation.navigate('ProfileSocialList', { listType: 'connections' })}
              >
                <Text style={styles.statNumber}>{profile?.collegamenti}</Text>
                <Text style={styles.statLabel}>Collegamenti</Text>
              </TouchableOpacity>
              <View style={styles.statDivider} />
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.statBox}
                onPress={() => navigation.navigate('ProfileSocialList', { listType: 'followers' })}
              >
                <Text style={styles.statNumber}>{profile?.seguaci}</Text>
                <Text style={styles.statLabel}>Seguaci</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.registrationDataCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Dati Personali Anagrafici</Text>
              <Text style={styles.sectionSubtitle}>L'icona indica lo stato di visibilità pubblica del dato</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.privacyButton,
                privacyEditMode && styles.privacyButtonActive,
              ]}
              onPress={handlePrivacyEditToggle}
            >
              <Ionicons
                name="settings-outline"
                size={20}
                color={privacyEditMode ? COLORS.confirm : COLORS.secondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.dataRow}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.primary} style={{ width: 24 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.dataLabel}>Data di Nascita</Text>
              <Text style={styles.dataValue}>{profile?.dataNascita}</Text>
            </View>
            <TouchableOpacity
              disabled={!privacyEditMode}
              onPress={() => togglePrivacyDraftField('privacyDataNascita')}
              style={[styles.eyeButton, privacyEditMode && styles.eyeButtonActive]}
            >
              <Ionicons
                name={privacyDraft.privacyDataNascita ? "eye" : "eye-off"}
                size={18}
                color={privacyDraft.privacyDataNascita ? COLORS.confirm : COLORS.gray}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.dataRow}>
            <Ionicons name="globe-outline" size={18} color={COLORS.primary} style={{ width: 24 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.dataLabel}>Nazione</Text>
              <Text style={styles.dataValue}>{profile?.nazione}</Text>
            </View>
            <TouchableOpacity
              disabled={!privacyEditMode}
              onPress={() => togglePrivacyDraftField('privacyNazione')}
              style={[styles.eyeButton, privacyEditMode && styles.eyeButtonActive]}
            >
              <Ionicons
                name={privacyDraft.privacyNazione ? "eye" : "eye-off"}
                size={18}
                color={privacyDraft.privacyNazione ? COLORS.confirm : COLORS.gray}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.dataRow}>
            <Ionicons name="location-outline" size={18} color={COLORS.primary} style={{ width: 24 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.dataLabel}>Città di Residenza</Text>
              <Text style={styles.dataValue}>{profile?.citta}</Text>
            </View>
            <TouchableOpacity
              disabled={!privacyEditMode}
              onPress={() => togglePrivacyDraftField('privacyCitta')}
              style={[styles.eyeButton, privacyEditMode && styles.eyeButtonActive]}
            >
              <Ionicons
                name={privacyDraft.privacyCitta ? "eye" : "eye-off"}
                size={18}
                color={privacyDraft.privacyCitta ? COLORS.confirm : COLORS.gray}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "projects" && styles.tabButtonActive]}
            onPress={() => selectContentTab('projects')}
          >
            <Text style={[styles.tabText, activeTab === "projects" && styles.tabTextActive]}>
              Progetti ({projects.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "experiences" && styles.tabButtonActive]}
            onPress={() => selectContentTab('experiences')}
          >
            <Text style={[styles.tabText, activeTab === "experiences" && styles.tabTextActive]}>
              Esperienze ({experiences.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={tabPagerRef}
          horizontal
          pagingEnabled
          style={activeTabHeight > 0 ? { height: activeTabHeight } : undefined}
          contentContainerStyle={styles.tabPagerContent}
          directionalLockEnabled
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onLayout={(event) => {
            const width = event.nativeEvent.layout.width;
            if (width !== tabPagerWidth) {
              setTabPagerWidth(width);
              const pageIndex = activeTab === 'projects' ? 0 : 1;
              tabPagerRef.current?.scrollTo({ x: pageIndex * width, animated: false });
            }
          }}
          onMomentumScrollEnd={(event) => {
            const pageIndex = Math.round(event.nativeEvent.contentOffset.x / pagerWidth);
            setActiveTab(pageIndex === 0 ? 'projects' : 'experiences');
          }}
        >
          <View
            style={[styles.tabContent, { width: pagerWidth }]}
            onLayout={(event) => {
              const height = event.nativeEvent.layout.height;
              setTabPageHeights((current) =>
                current.projects === height
                  ? current
                  : { ...current, projects: height }
              );
            }}
          >
            {projects.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.78}
                disabled={editingProfile}
                style={styles.itemCard}
                onPress={() => openProjectPage(item.id)}
              >
                <View style={styles.itemIcon}>
                  {item.foto ? (
                    <Image source={{ uri: item.foto }} style={styles.itemImage} />
                  ) : (
                    <FontAwesome5 name="project-diagram" size={16} color={COLORS.primary} />
                  )}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{item.nome}</Text>
                  <Text style={styles.itemSubtitle}>{item.settore} • {item.citta}</Text>
                  <Text numberOfLines={1} style={styles.dateDurationText}>
                    {item.openRoles.length > 0
                      ? item.openRoles.join(', ')
                      : 'Progetto creato da te'}
                  </Text>
                </View>
                {editingProfile ? (
                  <TouchableOpacity style={styles.btnModificaRecord} onPress={() => openProjectModal(item)}>
                    <Ionicons name="pencil" size={15} color={COLORS.white} />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View
            style={[styles.tabContent, { width: pagerWidth }]}
            onLayout={(event) => {
              const height = event.nativeEvent.layout.height;
              setTabPageHeights((current) =>
                current.experiences === height
                  ? current
                  : { ...current, experiences: height }
              );
            }}
          >
            {experiences.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.78}
                disabled={editingProfile}
                style={styles.itemCard}
                onPress={() => openExperiencePage(item.id)}
              >
                <View style={styles.itemIcon}>
                  <Ionicons name="briefcase" size={18} color={COLORS.primary} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{item.titolo}</Text>
                  <Text style={styles.itemSubtitle}>{item.settore ? `${item.settore} • ${item.progetto}` : item.progetto}</Text>
                  <Text style={styles.dateDurationText}>
                    📅 {formattaDataMeseAnno(item.inizio, language)} — {item.inCorso ? (language === 'it' ? 'Oggi' : 'Today') : formattaDataMeseAnno(item.fine, language)}
                  </Text>
                  <Text numberOfLines={2} style={styles.itemDescriptionPreview}>{item.descrizione}</Text>
                </View>
                {editingProfile ? (
                  <TouchableOpacity style={styles.btnModificaRecord} onPress={() => openExperienceModal(item)}>
                    <Ionicons name="pencil" size={15} color={COLORS.white} />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.postsSection}>
          <View style={styles.postsHeader}>
            <View>
              <Text style={styles.postsTitle}>I tuoi post</Text>
              <Text style={styles.postsSubtitle}>
                Condividi aggiornamenti e idee con la tua rete.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addPostButton}
              onPress={openCreatePost}
              disabled={postSaving}
            >
              <Ionicons name="add" size={18} color={COLORS.white} />
              <Text style={styles.addPostButtonText}>Scrivi</Text>
            </TouchableOpacity>
          </View>

          {posts.length === 0 ? (
            <View style={styles.emptyPostsCard}>
              <Ionicons name="create-outline" size={30} color={COLORS.gray} />
              <Text style={styles.emptyPostsTitle}>Nessun post</Text>
              <Text style={styles.emptyPostsText}>
                Pubblica il primo aggiornamento sul tuo profilo.
              </Text>
            </View>
          ) : (
            posts.map((post) => (
              <ProfilePostCard
                key={post.id}
                post={post}
                currentUserId={profile?.id ?? CURRENT_USER_ID}
                actionLoading={postActionLoading}
                onEdit={openEditPost}
                onDeletePost={removePost}
                onToggleLike={togglePostLike}
                onAddComment={addPostComment}
                onDeleteComment={removePostComment}
                onOpenEntity={openPostEntity}
              />
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={createMenuVisible} transparent animationType="fade" onRequestClose={closeCreateMenu}>
        <Pressable style={styles.modalOverlay} onPress={closeCreateMenu}>
          <Pressable
            style={styles.actionSheetContainer}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={styles.actionSheetTitle}>Aggiungi contenuto</Text>
            <Text style={styles.actionSheetDescription}>Scegli se creare un nuovo progetto o una nuova esperienza professionale.</Text>
            <TouchableOpacity style={styles.actionSheetBtn} onPress={() => { closeCreateMenu(); openCreateProjectModal(); }}>
              <Ionicons name="brush-outline" size={20} color={COLORS.primary} />
              <Text style={styles.actionSheetBtnText}>Nuovo progetto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionSheetBtn} onPress={() => { closeCreateMenu(); createNewExperience(); }}>
              <Ionicons name="briefcase-outline" size={20} color={COLORS.primary} />
              <Text style={styles.actionSheetBtnText}>Nuova esperienza</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionSheetBtn, styles.actionSheetCancelBtn]}
              onPress={closeCreateMenu}
            >
              <Text style={[styles.actionSheetBtnText, styles.actionSheetCancelText]}>Annulla</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={photoMenuVisible} transparent animationType="fade" onRequestClose={closePhotoMenu}>
        <Pressable style={styles.modalOverlay} onPress={closePhotoMenu}>
          <Pressable
            style={styles.actionSheetContainer}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={styles.actionSheetTitle}>
              {isCoverPhotoMenu ? 'Aggiorna Immagine di Copertina' : 'Aggiorna Foto Profilo'}
            </Text>
            <TouchableOpacity style={styles.actionSheetBtn} onPress={() => handlePhotoChoice('scatta')}>
              <Ionicons name="camera-outline" size={20} color={COLORS.primary} />
              <Text style={styles.actionSheetBtnText}>Scatta Nuova Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionSheetBtn} onPress={() => handlePhotoChoice('galleria')}>
              <Ionicons name="image-outline" size={20} color={COLORS.primary} />
              <Text style={styles.actionSheetBtnText}>Seleziona dalla Galleria</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionSheetBtn, { borderBottomWidth: 0, marginTop: 8 }]}
              onPress={closePhotoMenu}
            >
              <Text style={[styles.actionSheetBtnText, { color: COLORS.delete, fontWeight: 'bold' }]}>Annulla</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={postEditorVisible}
        animationType="slide"
        onRequestClose={closePostEditor}
      >
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <TouchableOpacity onPress={closePostEditor} disabled={postSaving}>
              <Ionicons name="close" size={24} color={COLORS.textStrong} />
            </TouchableOpacity>
            <Text style={modalStyles.headerTitle}>
              {selectedPost ? 'Modifica post' : 'Nuovo post'}
            </Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView
            contentContainerStyle={modalStyles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <Text style={modalStyles.label}>Cosa vuoi condividere?</Text>
            <TextInput
              style={modalStyles.postInput}
              multiline
              textAlignVertical="top"
              placeholder="Scrivi un aggiornamento..."
              placeholderTextColor={COLORS.gray}
              value={postDraftBody}
              onChangeText={setPostDraftBody}
              editable={!postSaving}
            />

            {postDraftImageUri && (
              <View style={modalStyles.postImageWrap}>
                <Image source={{ uri: postDraftImageUri }} style={modalStyles.postImage} />
                <TouchableOpacity
                  style={modalStyles.removePostImageButton}
                  onPress={() => setPostDraftImageUri(null)}
                  disabled={postSaving}
                >
                  <Ionicons name="close" size={18} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={modalStyles.addImageButton}
              onPress={pickPostImage}
              disabled={postSaving}
            >
              <Ionicons name="image-outline" size={20} color={COLORS.primary} />
              <Text style={modalStyles.addImageText}>Aggiungi immagine</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={modalStyles.buttonSubmit}
              onPress={() => void savePost()}
              disabled={postSaving}
            >
              {postSaving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={modalStyles.buttonSubmitText}>
                  {selectedPost ? 'Salva modifiche' : 'Pubblica post'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={isCreateProjectModalVisible} animationType="slide" onRequestClose={closeCreateProjectModal}>
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <TouchableOpacity onPress={closeCreateProjectModal}>
              <Ionicons name="close" size={24} color={COLORS.secondary} />
            </TouchableOpacity>
            <Text style={modalStyles.headerTitle}>Nuovo Progetto</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView contentContainerStyle={modalStyles.scroll}>
            <Text style={modalStyles.label}>Nome del Progetto *</Text>
            <TextInput
              style={modalStyles.input}
              placeholder="Nome"
              value={selectedProject?.nome}
              onChangeText={(text) => updateSelectedProjectValue('nome', text)}
            />
            <Text style={modalStyles.label}>Settore di Interesse *</Text>
            <TextInput
              style={modalStyles.input}
              placeholder="Settore"
              value={selectedProject?.settore}
              onChangeText={(text) => updateSelectedProjectValue('settore', text)}
            />
            <Text style={modalStyles.label}>Stato *</Text>
            <TextInput
              style={modalStyles.input}
              placeholder="Italia"
              value={selectedProject?.stato}
              onChangeText={(text) => updateSelectedProjectValue('stato', text)}
            />
            <Text style={modalStyles.label}>Città di Riferimento *</Text>
            <TextInput
              style={modalStyles.input}
              placeholder="Città"
              value={selectedProject?.citta}
              onChangeText={(text) => updateSelectedProjectValue('citta', text)}
            />
            <Text style={modalStyles.label}>Immagine progetto</Text>
            <TouchableOpacity
              style={modalStyles.projectImagePicker}
              onPress={pickSelectedProjectImage}
            >
              {selectedProject?.foto ? (
                <Image source={{ uri: selectedProject.foto }} style={modalStyles.projectImage} />
              ) : (
                <>
                  <Ionicons name="image-outline" size={24} color={COLORS.primary} />
                  <Text style={modalStyles.projectImageText}>Scegli immagine</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={modalStyles.label}>Descrizione *</Text>
            <TextInput
              style={[modalStyles.input, { minHeight: 92, textAlignVertical: 'top' }]}
              multiline
              placeholder="Racconta cosa state costruendo"
              value={selectedProject?.descrizione}
              onChangeText={(text) => updateSelectedProjectValue('descrizione', text)}
            />
            <Text style={modalStyles.label}>Ruoli aperti</Text>
            <TextInput
              style={modalStyles.input}
              placeholder="Es. Mobile developer, Designer"
              value={selectedProject?.openRoles.join(', ')}
              onChangeText={updateSelectedProjectOpenRoles}
            />
            <Text style={modalStyles.label}>Collaboratori</Text>
            <TextInput
              style={modalStyles.input}
              placeholder="Collaboratori"
              value={selectedProject?.collaboratori}
              onChangeText={(text) => updateSelectedProjectValue('collaboratori', text)}
            />
            <TouchableOpacity style={modalStyles.buttonSubmit} onPress={handleCreateProject}>
              <Text style={modalStyles.buttonSubmitText}>Crea e apri progetto</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={isProjectModalVisible} animationType="slide" onRequestClose={closeProjectModal}>
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <TouchableOpacity onPress={closeProjectModal}>
              <Ionicons name="close" size={24} color={COLORS.secondary} />
            </TouchableOpacity>
            <Text style={modalStyles.headerTitle}>Modifica Progetto</Text>
            <View style={{ width: 24 }} />
          </View>
          {selectedProject && (
            <ScrollView contentContainerStyle={modalStyles.scroll}>
              <Text style={modalStyles.label}>Nome Progetto</Text>
              <TextInput
                style={modalStyles.input}
                value={selectedProject.nome}
                onChangeText={(text) => updateSelectedProjectValue('nome', text)}
              />
              <Text style={modalStyles.label}>Settore</Text>
              <TextInput
                style={modalStyles.input}
                value={selectedProject.settore}
                onChangeText={(text) => updateSelectedProjectValue('settore', text)}
              />
              <Text style={modalStyles.label}>Stato</Text>
              <TextInput
                style={modalStyles.input}
                value={selectedProject.stato}
                onChangeText={(text) => updateSelectedProjectValue('stato', text)}
              />
              <Text style={modalStyles.label}>Città</Text>
              <TextInput
                style={modalStyles.input}
                value={selectedProject.citta}
                onChangeText={(text) => updateSelectedProjectValue('citta', text)}
              />
              <Text style={modalStyles.label}>Immagine progetto</Text>
              <TouchableOpacity
                style={modalStyles.projectImagePicker}
                onPress={pickSelectedProjectImage}
              >
                {selectedProject.foto ? (
                  <Image source={{ uri: selectedProject.foto }} style={modalStyles.projectImage} />
                ) : (
                  <>
                    <Ionicons name="image-outline" size={24} color={COLORS.primary} />
                    <Text style={modalStyles.projectImageText}>Scegli immagine</Text>
                  </>
                )}
              </TouchableOpacity>
              <Text style={modalStyles.label}>Descrizione</Text>
              <TextInput
                style={[modalStyles.input, { minHeight: 92, textAlignVertical: 'top' }]}
                multiline
                value={selectedProject.descrizione}
                onChangeText={(text) => updateSelectedProjectValue('descrizione', text)}
              />
              <Text style={modalStyles.label}>Ruoli aperti</Text>
              <TextInput
                style={modalStyles.input}
                value={selectedProject.openRoles.join(', ')}
                onChangeText={updateSelectedProjectOpenRoles}
              />
              <TouchableOpacity style={[modalStyles.buttonSubmit, { backgroundColor: COLORS.confirm }]} onPress={handleSaveProject}>
                <Text style={modalStyles.buttonSubmitText}>Salva Modifiche</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modalStyles.buttonDelete} onPress={removeProject}>
                <Ionicons name="trash-outline" size={18} color={COLORS.delete} />
                <Text style={modalStyles.buttonDeleteText}>Elimina Progetto</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>

      <Modal visible={isExperienceModalVisible} animationType="slide" onRequestClose={closeExperienceModal}>
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <TouchableOpacity onPress={closeExperienceModal}>
              <Ionicons name="close" size={24} color={COLORS.secondary} />
            </TouchableOpacity>
            <Text style={modalStyles.headerTitle}>{selectedExperience?.id ? 'Modifica Esperienza' : 'Nuova Esperienza'}</Text>
            <View style={{ width: 24 }} />
          </View>
          {selectedExperience && (
            <ScrollView contentContainerStyle={modalStyles.scroll}>
              <Text style={modalStyles.label}>Mansione / Ruolo *</Text>
              <TextInput
                style={modalStyles.input}
                value={selectedExperience.titolo}
                onChangeText={(text) => updateSelectedExperienceValue('titolo', text)}
              />
              <Text style={modalStyles.label}>Settore *</Text>
              <TextInput
                style={modalStyles.input}
                value={selectedExperience.settore}
                onChangeText={(text) => updateSelectedExperienceValue('settore', text)}
              />
              <Text style={modalStyles.label}>Progetto di riferimento *</Text>
              <TextInput
                style={modalStyles.input}
                placeholder="Nome progetto"
                value={selectedExperience.paginaProgetto}
                onChangeText={(text) => updateSelectedExperienceValue('paginaProgetto', text)}
              />
              <Text style={modalStyles.label}>Società / Progetto *</Text>
              <TextInput
                style={modalStyles.input}
                value={selectedExperience.progetto}
                onChangeText={(text) => updateSelectedExperienceValue('progetto', text)}
              />
              <Text style={modalStyles.label}>Breve descrizione</Text>
              <TextInput
                style={[modalStyles.input, { height: 90, textAlignVertical: 'top' }]}
                multiline
                value={selectedExperience.descrizione}
                onChangeText={(text) => updateSelectedExperienceValue('descrizione', text)}
              />
              <TouchableOpacity
                style={modalStyles.checkboxContainer}
                onPress={() => updateSelectedExperienceValue('inCorso', !selectedExperience.inCorso)}
              >
                <Ionicons
                  name={selectedExperience.inCorso ? "checkbox" : "square-outline"}
                  size={22}
                  color={COLORS.primary}
                />
                <Text style={modalStyles.checkboxLabel}>Collaborazione in corso</Text>
              </TouchableOpacity>

              <Text style={modalStyles.label}>Data di Inizio *</Text>
              <TouchableOpacity
                style={modalStyles.inputDatePicker}
                onPress={() => {
                  setShowInizioPicker(!showInizioPicker);
                  setShowFinePicker(false);
                }}
              >
                <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                <Text style={modalStyles.dateText}>{formattaDataMeseAnno(selectedExperience.inizio, language)}</Text>
                <Ionicons name={showInizioPicker ? "chevron-up" : "chevron-down"} size={16} color={COLORS.gray} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
              {showInizioPicker && (
                <View style={modalStyles.iosPickerWrapper}>
                  <DateTimePicker
                    value={selectedExperience.inizio ? new Date(selectedExperience.inizio) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    locale={language === 'it' ? 'it-IT' : 'en-US'}
                    textColor={COLORS.white}
                    maximumDate={new Date()}
                    onChange={(_event: DateTimePickerEvent, date?: Date) => {
                      if (date) updateSelectedExperienceValue('inizio', date);
                    }}
                  />
                </View>
              )}

              {!selectedExperience.inCorso && (
                <>
                  <Text style={modalStyles.label}>Data di Fine *</Text>
                  <TouchableOpacity
                    style={modalStyles.inputDatePicker}
                    onPress={() => {
                      setShowFinePicker(!showFinePicker);
                      setShowInizioPicker(false);
                    }}
                  >
                    <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                    <Text style={modalStyles.dateText}>{formattaDataMeseAnno(selectedExperience.fine, language)}</Text>
                    <Ionicons name={showFinePicker ? "chevron-up" : "chevron-down"} size={16} color={COLORS.gray} style={{ marginLeft: 'auto' }} />
                  </TouchableOpacity>
                  {showFinePicker && (
                    <View style={modalStyles.iosPickerWrapper}>
                      <DateTimePicker
                        value={selectedExperience.fine ? new Date(selectedExperience.fine) : new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        locale={language === 'it' ? 'it-IT' : 'en-US'}
                        textColor={COLORS.white}
                        maximumDate={new Date()}
                        onChange={(_event: DateTimePickerEvent, date?: Date) => {
                          if (date) updateSelectedExperienceValue('fine', date);
                        }}
                      />
                    </View>
                  )}
                </>
              )}

              <TouchableOpacity style={[modalStyles.buttonSubmit, { backgroundColor: COLORS.confirm, marginTop: 25 }]} onPress={saveExperience}>
                <Text style={modalStyles.buttonSubmitText}>Salva Modifiche</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modalStyles.buttonDelete} onPress={removeExperience}>
                <Ionicons name="trash-outline" size={18} color={COLORS.delete} />
                <Text style={modalStyles.buttonDeleteText}>Elimina Esperienza</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}
