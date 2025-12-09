#!/usr/bin/env node
/**
 * Integration test for AI Food Advisor API
 * Tests the complete flow from API endpoint to Lambda invocation
 */

const testQueries = [
  {
    name: "Basic Nutrition Query",
    payload: {
      query: "Tell me about the nutritional content of pizza",
      restaurantId: "test-restaurant-123"
    }
  },
  {
    name: "Dietary Restriction Query",
    payload: {
      query: "I'm diabetic, what should I avoid?",
      restaurantId: "test-restaurant-123"
    }
  },
  {
    name: "Dish Context Query",
    payload: {
      query: "How many calories does this have?",
      restaurantId: "test-restaurant-123",
      dishContext: {
        itemId: "test-dish-456",
        name: "Margherita Pizza"
      }
    }
  }
];

async function testHealthCheck() {
  console.log('\n🔍 Testing AI Service Health Check...');
  
  try {
    const response = await fetch('http://localhost:3000/api/ai/query', {
      method: 'GET'
    });
    
    const data = await response.json();
    
    if (response.ok && data.status === 'ok') {
      console.log('✅ Health check passed');
      console.log(`   Service: ${data.service}`);
      console.log(`   Lambda Function: ${data.lambdaFunction}`);
      console.log(`   Region: ${data.region}`);
      return true;
    } else {
      console.log('❌ Health check failed');
      console.log(`   Status: ${data.status}`);
      console.log(`   Message: ${data.message}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    return false;
  }
}

async function testAIQuery(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`   Query: "${testCase.payload.query}"`);
  
  try {
    const response = await fetch('http://localhost:3000/api/ai/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCase.payload)
    });
    
    const data = await response.json();
    
    if (response.ok && data.textResponse) {
      console.log('✅ Query successful');
      console.log(`   Response: ${data.textResponse.substring(0, 100)}...`);
      
      if (data.audioUrl) {
        console.log(`   Audio URL: ${data.audioUrl}`);
      }
      
      if (data.nutritionData) {
        console.log(`   Nutrition Data: Available`);
      }
      
      return true;
    } else {
      console.log('❌ Query failed');
      console.log(`   Error: ${data.error || 'Unknown error'}`);
      
      if (data.textResponse) {
        console.log(`   Fallback Response: ${data.textResponse.substring(0, 100)}...`);
      }
      
      return false;
    }
  } catch (error) {
    console.log('❌ Query error:', error.message);
    return false;
  }
}

async function testValidation() {
  console.log('\n🔍 Testing Input Validation...');
  
  // Test missing query
  try {
    const response = await fetch('http://localhost:3000/api/ai/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        restaurantId: "test-restaurant-123"
      })
    });
    
    const data = await response.json();
    
    if (response.status === 400 && data.error) {
      console.log('✅ Validation test passed (missing query)');
      return true;
    } else {
      console.log('❌ Validation test failed - should reject missing query');
      return false;
    }
  } catch (error) {
    console.log('❌ Validation test error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('=' .repeat(60));
  console.log('AI Food Advisor Integration Tests');
  console.log('=' .repeat(60));
  
  let passed = 0;
  let total = 0;
  
  // Health check
  total++;
  if (await testHealthCheck()) {
    passed++;
  }
  
  // Validation test
  total++;
  if (await testValidation()) {
    passed++;
  }
  
  // Query tests
  for (const testCase of testQueries) {
    total++;
    if (await testAIQuery(testCase)) {
      passed++;
    }
    
    // Add delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log(`Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! AI integration is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.');
  }
  
  console.log('=' .repeat(60));
  
  return passed === total;
}

// Run tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
