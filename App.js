import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";

export default function App() {
  return (
    <SQLiteProvider databaseName="contacts.db">
      <ContactsApp />
    </SQLiteProvider>
  );
}

function ContactsApp() {
  const db = useSQLiteContext();
  const [contacts, setContacts] = useState([]);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Cria tabela na primeira execução
  useEffect(() => {
    (async () => {
      await createTable();
      await loadContacts();
    })();
  }, []);

  const createTable = async () => {
    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        surname TEXT,
        phone TEXT,
        email TEXT
      );`
    );
  };

  const loadContacts = async () => {
    const results = await db.getAllAsync("SELECT * FROM contacts;");
    setContacts(results);
  };

  const clearForm = () => {
    setName("");
    setSurname("");
    setPhone("");
    setEmail("");
    setEditingId(null);
  };

  const handleAddOrEdit = async () => {
    if (!name || !phone) {
      Alert.alert("Erro", "Nome e telefone são obrigatórios!");
      return;
    }

    if (editingId !== null) {
      // Editar
      await db.runAsync(
        "UPDATE contacts SET name=?, surname=?, phone=?, email=? WHERE id=?",
        [name, surname, phone, email, editingId]
      );
    } else {
      // Criar novo
      await db.runAsync(
        "INSERT INTO contacts (name, surname, phone, email) VALUES (?,?,?,?)",
        [name, surname, phone, email]
      );
    }

    await loadContacts();
    clearForm();
  };

  const handleEdit = (contact) => {
    setName(contact.name);
    setSurname(contact.surname);
    setPhone(contact.phone);
    setEmail(contact.email);
    setEditingId(contact.id);
  };

  const handleDelete = async (id) => {
    await db.runAsync("DELETE FROM contacts WHERE id=?", [id]);
    await loadContacts();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>📒 Agenda de Contatos</Text>

      {/* Formulário */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Nome"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Sobrenome"
          value={surname}
          onChangeText={setSurname}
        />
        <TextInput
          style={styles.input}
          placeholder="Telefone"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TouchableOpacity style={styles.button} onPress={handleAddOrEdit}>
          <Text style={styles.buttonText}>
            {editingId !== null ? "Salvar Alterações" : "Adicionar Contato"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de contatos */}
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.contactCard}>
            <Text style={styles.contactText}>
              {item.name} {item.surname}
            </Text>
            <Text style={styles.contactSub}>
              📞 {item.phone} | 📧 {item.email}
            </Text>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => handleEdit(item)}>
                <Text style={styles.edit}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={styles.delete}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  form: { marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  contactCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  contactText: { fontSize: 18, fontWeight: "bold" },
  contactSub: { fontSize: 14, color: "#555", marginBottom: 5 },
  actions: { flexDirection: "row", justifyContent: "space-between" },
  edit: { color: "green", fontWeight: "bold" },
  delete: { color: "red", fontWeight: "bold" },
});
