/**
 * Permission Seeding Utilities
 * Comprehensive permission seeding based on role context matrix
 */

import { PrismaClient } from '@prisma/client';
import { 
  ROLE_PERMISSIONS, 
  PERMISSIONS, 
  getAllPermissions, 
  getRolePermissions 
} from '../src/config/permissions';

const prisma = new PrismaClient();

export interface SeedPermissionOptions {
  clearExisting?: boolean;
  roleNames?: string[];
  verbose?: boolean;
}

/**
 * Seed all permissions into the database
 */
export async function seedPermissions(options: SeedPermissionOptions = {}) {
  const { clearExisting = false, roleNames, verbose = true } = options;

  if (verbose) {
    console.log('🌱 Starting permission seeding...');
  }

  try {
    // Clear existing permissions if requested
    if (clearExisting) {
      if (verbose) {
        console.log('🧹 Clearing existing role permissions...');
      }
      await prisma.role.updateMany({
        data: {
          permissions: [],
        },
      });
    }

    // Get roles to update
    const rolesToUpdate = roleNames || Object.keys(ROLE_PERMISSIONS);
    
    if (verbose) {
      console.log(`🎯 Updating permissions for roles: ${rolesToUpdate.join(', ')}`);
    }

    // Update each role with comprehensive permissions
    for (const roleName of rolesToUpdate) {
      if (!(roleName in ROLE_PERMISSIONS)) {
        console.warn(`⚠️  Unknown role: ${roleName}, skipping...`);
        continue;
      }

      const rolePermissions = getRolePermissions(roleName as keyof typeof ROLE_PERMISSIONS);
      
      // Find the role in database
      const role = await prisma.role.findFirst({
        where: { name: roleName },
      });

      if (!role) {
        if (verbose) {
          console.log(`📝 Creating new role: ${roleName}`);
        }
        
        // Create role if it doesn't exist
        await prisma.role.create({
          data: {
            name: roleName,
            description: getRoleDescription(roleName),
            permissions: [...rolePermissions],
          },
        });
      } else {
        if (verbose) {
          console.log(`🔄 Updating role: ${roleName} (${rolePermissions.length} permissions)`);
        }
        
        // Update existing role
        await prisma.role.update({
          where: { id: role.id },
          data: {
            permissions: [...rolePermissions],
          },
        });
      }
    }

    if (verbose) {
      console.log('✅ Permission seeding completed successfully');
      console.log(`📊 Total available permissions: ${getAllPermissions().length}`);
      
      // Log summary of permissions per role
      for (const roleName of rolesToUpdate) {
        if (roleName in ROLE_PERMISSIONS) {
          const permissionCount = getRolePermissions(roleName as keyof typeof ROLE_PERMISSIONS).length;
          console.log(`   - ${roleName}: ${permissionCount} permissions`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    throw error;
  }
}

/**
 * Validate that all role permissions are valid
 */
export async function validatePermissions(verbose: boolean = true) {
  if (verbose) {
    console.log('🔍 Validating permission definitions...');
  }

  const allValidPermissions = getAllPermissions();
  const issues: string[] = [];

  for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    for (const permission of permissions) {
      if (!allValidPermissions.includes(permission)) {
        issues.push(`Invalid permission '${permission}' in role '${roleName}'`);
      }
    }
  }

  if (issues.length > 0) {
    console.error('❌ Permission validation failed:');
    issues.forEach(issue => console.error(`   - ${issue}`));
    throw new Error(`Found ${issues.length} permission validation issues`);
  }

  if (verbose) {
    console.log('✅ All permissions are valid');
  }
}

/**
 * Get permission statistics
 */
export async function getPermissionStats() {
  const stats = {
    totalPermissions: getAllPermissions().length,
    roleStats: {} as Record<string, number>,
    categoryStats: {} as Record<string, number>,
  };

  // Role statistics
  for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    stats.roleStats[roleName] = permissions.length;
  }

  // Category statistics
  const categories = new Set<string>();
  getAllPermissions().forEach(permission => {
    const category = permission.split(':')[0];
    categories.add(category);
    stats.categoryStats[category] = (stats.categoryStats[category] || 0) + 1;
  });

  return stats;
}

/**
 * Get role description based on role name
 */
function getRoleDescription(roleName: string): string {
  const descriptions: Record<string, string> = {
    SUPERADMIN: 'Global super admin role with full system access across all modules and resources',
    APPROVER: 'Role for approving requests, reviewing reports, and managing approval workflows',
    STAFF: 'General staff role for operational tasks including transaction encoding and document management',
    CLIENT: 'Client role for accessing services, viewing own data, and submitting requests',
  };

  return descriptions[roleName] || `${roleName} role with specific permissions`;
}

/**
 * Display permission matrix for debugging
 */
export async function displayPermissionMatrix(verbose: boolean = true) {
  if (!verbose) return;

  console.log('\n📋 PERMISSION MATRIX');
  console.log('='.repeat(80));

  const categories = new Set<string>();
  getAllPermissions().forEach(permission => {
    categories.add(permission.split(':')[0]);
  });

  for (const category of Array.from(categories).sort()) {
    console.log(`\n🏷️  ${category.toUpperCase()} PERMISSIONS:`);
    
    const categoryPermissions = getAllPermissions().filter(p => p.startsWith(`${category}:`));
    
    // Table header
    const roles = Object.keys(ROLE_PERMISSIONS);
    console.log(`${'Permission'.padEnd(35)} | ${roles.join(' | ')}`);
    console.log('-'.repeat(35 + (roles.length * 15)));

    // Table rows
    for (const permission of categoryPermissions) {
      const shortPerm = permission.replace(`${category}:`, '');
      let row = shortPerm.padEnd(35) + ' |';
      
      for (const roleName of roles) {
        const hasPermission = getRolePermissions(roleName as keyof typeof ROLE_PERMISSIONS).includes(permission);
        row += ` ${hasPermission ? '✅' : '❌'}`.padEnd(15) + '|';
      }
      
      console.log(row);
    }
  }
  
  console.log('='.repeat(80));
}

/**
 * Main seeding function that can be called independently
 */
async function main() {
  console.log('🚀 Starting comprehensive permission seeding...\n');

  try {
    // Validate permissions first
    await validatePermissions();
    
    // Display permission matrix
    await displayPermissionMatrix();
    
    // Show statistics
    const stats = await getPermissionStats();
    console.log('\n📊 PERMISSION STATISTICS:');
    console.log(`Total Permissions: ${stats.totalPermissions}`);
    console.log('Role Breakdown:');
    Object.entries(stats.roleStats).forEach(([role, count]) => {
      console.log(`  - ${role}: ${count} permissions`);
    });
    console.log('Category Breakdown:');
    Object.entries(stats.categoryStats).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count} permissions`);
    });

    // Seed permissions
    await seedPermissions({
      clearExisting: true,
      verbose: true,
    });

    console.log('\n🎉 Permission seeding completed successfully!');

  } catch (error) {
    console.error('\n💥 Permission seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .catch((e: any) => {
      console.error(e);
      process.exit(1);
    });
}

export default {
  seedPermissions,
  validatePermissions,
  getPermissionStats,
  displayPermissionMatrix,
  main,
};
