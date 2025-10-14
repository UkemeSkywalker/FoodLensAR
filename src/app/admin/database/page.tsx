"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DatabaseAdminPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const disableRLS = async () => {
    setLoading(true);
    setMessage("");

    try {
      // Try to disable RLS using raw SQL
      const { error: error1 } = await supabase
        .from("restaurants")
        .select("count")
        .limit(1);

      if (error1) {
        console.error("RLS test error:", error1);
      }

      // Test if we can insert without RLS
      const testEmail = `test-rls-${Date.now()}@example.com`;
      const { error } = await supabase
        .from("restaurants")
        .insert([
          {
            name: "Test Restaurant RLS",
            email: testEmail,
          },
        ])
        .select();

      if (error) {
        setMessage("RLS is still enabled. Error: " + error.message);
      } else {
        setMessage("RLS appears to be disabled. Test insert successful.");

        // Clean up test data
        await supabase.from("restaurants").delete().eq("email", testEmail);
      }
    } catch (error) {
      setMessage("Error testing RLS: " + error);
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
    setLoading(true);
    setMessage("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setMessage(`Authenticated as: ${session.user.email}`);
      } else {
        setMessage("Not authenticated");
      }
    } catch (error) {
      setMessage("Auth test error: " + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Database Admin
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Development database management tools
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <div className="space-y-4">
            <button
              onClick={testAuth}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Testing..." : "Test Authentication"}
            </button>

            <button
              onClick={disableRLS}
              disabled={loading}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Testing..." : "Test RLS Status"}
            </button>
          </div>

          {message && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md">
              <p className="text-sm text-gray-700">{message}</p>
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Instructions
            </h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                1. Run the SQL in disable-rls.sql in your Supabase dashboard
              </p>
              <p>2. Test RLS status using the button above</p>
              <p>3. Try creating a new account after RLS is disabled</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
