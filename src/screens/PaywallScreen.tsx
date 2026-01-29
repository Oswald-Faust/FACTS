import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import PurchaseService from '../services/PurchaseService';


const PaywallScreen = ({ onClose }: { onClose: () => void }) => {
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOfferings();
    }, []);

    const loadOfferings = async () => {
        setLoading(true);
        try {
            const availablePackages = await PurchaseService.getOfferings();
            setPackages(availablePackages);
        } catch (e) {
            Alert.alert('Erreur', 'Impossible de charger les abonnements.');
        } finally {
            setLoading(false);
        }
    };

    const onPurchase = async (pack: PurchasesPackage) => {
        setLoading(true);
        try {
            const info = await PurchaseService.purchasePackage(pack);
            if (info?.entitlements.active['premium']) { 
                 // Replace 'premium' with your actual entitlement ID
                Alert.alert('Succès', 'Bienvenue dans le club Premium !');
                onClose();
            }
        } catch (e: any) {
             console.log(e);
        } finally {
            setLoading(false);
        }
    };

    const onRestore = async () => {
        setLoading(true);
        try {
            const info = await PurchaseService.restorePurchases();
            if (info?.entitlements.active['premium']) {
                 Alert.alert('Succès', 'Vos achats ont été restaurés.');
                 onClose();
            } else {
                 Alert.alert('Info', 'Aucun abonnement actif trouvé.');
            }
        } catch (e) {
            Alert.alert('Erreur', 'Échec de la restauration.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Devenez Premium</Text>
            <Text style={styles.subtitle}>Accédez à tout le contenu exclusif</Text>

            {packages.map((pack) => (
                <TouchableOpacity
                    key={pack.identifier}
                    style={styles.packageButton}
                    onPress={() => onPurchase(pack)}
                >
                    <Text style={styles.packageTitle}>{pack.product.title}</Text>
                    <Text style={styles.packagePrice}>{pack.product.priceString}</Text>
                </TouchableOpacity>
            ))}

            <TouchableOpacity onPress={onRestore} style={styles.restoreButton}>
                <Text style={styles.restoreText}>Restaurer les achats</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 1,
    },
    closeButtonText: {
        fontSize: 16,
        color: '#007AFF',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        marginTop: 60,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
        textAlign: 'center',
    },
    packageButton: {
        backgroundColor: '#f0f0f0',
        padding: 20,
        borderRadius: 12,
        width: '100%',
        marginBottom: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    packageTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    packagePrice: {
        marginTop: 5,
        fontSize: 16,
        color: '#007AFF',
    },
    restoreButton: {
        marginTop: 20,
    },
    restoreText: {
        color: '#666',
        textDecorationLine: 'underline',
    },
});

export default PaywallScreen;
